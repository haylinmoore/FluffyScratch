const express = require("express");
const app = express();
const port = 3000;
const fetch = require("node-fetch");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);

// Magic Number Definitions
const QUEUE_REQUEST_TIMEOUT = 100; // Wait 100ms between using the queue
const EMPHERAL_DATA_SAVE = 1000 * 60; // Save Empheral data every 60s
const ONLINE_CUTOFF_TIME = 1000 * 60 * 1; // Users are online if they pinged within a minute

// Set some defaults (required if your JSON file is empty)
db.defaults({
	users: {},
	analytics: {
		totalRequests: 0,
		requestsToScratch: 0,
	},
}).write();

// Ephemeral data

let empheralData = {
	queueAdditions: 0, // No point in saving in the database as it resets every 5 seconds
	// Saves the metric below to the database every minute
	requestsToScratch: 0,
	totalRequests: 0,
	inNotificationQueue: [],
};

function createUser(data) {
	if (!data.hasOwnProperty("username")) {
		throw "CreateUser: requires a username";
	}
	return {
		username: data.username || "",
		id: data.id || -1,
		lastKeepAlive: data.lastKeepAlive || 0,
		messages: data.messages || -1,
	};
}

function updateUser(username, newData) {
	let user = db.get(`users.${username}`);

	if (user.value() === undefined) {
		db.set(
			`users.${username}`,
			createUser({ ...newData, username: username })
		).write();
	} else {
		db.set(`users.${username}`, {
			...user.value(),
			...newData,
		}).write();
	}
}

function getUserItem(username, item) {
	return db.get(`users.${username}.${item}`).value();
}

const QUEUE_TYPES = {
	Notifications: 0,
	CloudDataVerification: 1,
};

let queues = [];

function addQueue(type, data) {
	const queueItem = { type: type, data: data };

	empheralData.queueAdditions++;

	switch (type) {
		case QUEUE_TYPES.Notifications:
			queues.push(queueItem);
			break;
		case QUEUE_TYPES.CloudDataVerification:
			queues.unshift(queueItem);
			break;
		default:
			throw `ILLEGAL QUEUE TYPE OF ${type}`;
	}
}

setInterval(() => {
	let latestQueue = queues.shift();

	if (latestQueue == undefined) {
		return;
	}

	switch (latestQueue.type) {
		case QUEUE_TYPES.Notifications:
			fetch(
				`https://api.scratch.mit.edu/users/${latestQueue.data.username}/messages/count`
			)
				.then((response) => response.json())
				.then((data) => {
					updateUser(latestQueue.data.username, {
						messages: data.count,
					});
				});
			empheralData.requestsToScratch++;
			// Remove the user from the inNotificationQueue
			empheralData.inNotificationQueue.splice(
				empheralData.inNotificationQueue.indexOf(
					latestQueue.data.username
				),
				1
			);
			break;

		case undefined:
			break;
	}
}, QUEUE_REQUEST_TIMEOUT);

setInterval(() => {
	db.set("analytics.totalRequests", empheralData.totalRequests)
		.set("analytics.requestsToScratch", empheralData.requestsToScratch)
		.write();
}, EMPHERAL_DATA_SAVE);

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	next();
	if (req.originalUrl != "/metrics") {
		empheralData.totalRequests++;
	}
});

app.get("/", (req, res) =>
	res.send("If you do not know what this is you should not be here <3")
);

app.get("/notifications/v2/:username", (req, res) => {
	let username = req.params.username;

	updateUser(username, { lastKeepAlive: new Date().valueOf() });

	if (!empheralData.inNotificationQueue.includes(username)) {
		addQueue(QUEUE_TYPES.Notifications, {
			username: username,
		});
		empheralData.inNotificationQueue.push(username);
	}

	res.json({
		count: getUserItem(username, "messages"),
	});
});

app.get("/profilepicture/v1/:username", (req, res) => {
	let userID = getUserItem(req.params.username, "id");

	if (userID === -1) {
		fetch("https://scratchdb.lefty.one/v2/user/info/" + req.params.username)
			.then((response) => response.json())
			.then((data) => {
				res.redirect(
					301,
					`https://cdn2.scratch.mit.edu/get_image/user/${data.id}_60x60.png`
				);
				updateUser(req.params.username, { id: data.id });
			})
			.catch((err) => {
				res.send("brrrr");
			});
	} else {
		res.redirect(
			301,
			`https://cdn2.scratch.mit.edu/get_image/user/${userID}_60x60.png`
		);
	}
});

function getActiveUsers() {
	const currentDate = new Date().valueOf();

	return db
		.get(`users`)
		.filter((data) => {
			return currentDate - data.lastKeepAlive < ONLINE_CUTOFF_TIME;
		})
		.map((data) => {
			return data.username;
		})
		.value();
}

app.get("/showusers/v1/hiddenkey6940", (req, res) => {
	res.json(getActiveUsers());
});

app.get("/metrics", (req, res) => {
	let timestamp = new Date().getTime();

	let analytics = db.get(`analytics`).value();
	let users = db.get(`users`).value();

	let metricData = `
# HELP scratch_proxy_request_total The total number of HTTP requests.
# TYPE scratch_proxy_request_total counter
scratch_proxy_request_total ${empheralData.totalRequests} ${timestamp}
# HELP scratch_proxy_queue_since The amount of additions to the queue since the last time prometheus checked
scratch_proxy_queue_since ${empheralData.queueAdditions} ${timestamp}
# HELP scratch_proxy_users_served Total users served
# TYPE scratch_proxy_users_served counter
scratch_proxy_users_served ${Object.keys(users).length} ${timestamp}
# HELP scratch_proxy_active_users Total active users
# TYPE scratch_proxy_active_users gauge
scratch_proxy_active_users ${getActiveUsers().length} ${timestamp}
# HELP scratch_proxy_queued_users Queued Users
# TYPE scratch_proxy_queued_users gauge
scratch_proxy_queued_users ${
		empheralData.inNotificationQueue.length
	} ${timestamp}
# HELP scratch_proxy_reqs_to_scratch Total requests to Scratch
# TYPE scratch_proxy_reqs_to_scratch counter
scratch_proxy_reqs_to_scratch ${empheralData.requestsToScratch} ${timestamp}
`;

	res.send(metricData);

	empheralData.queueAdditions = 0;
});

app.get("/showqueue", (req, res) => {
	res.json(JSON.stringify(queues));
});

app.listen(port, () =>
	console.log(`Example app listening at http://localhost:${port}`)
);

// Go brrrr
