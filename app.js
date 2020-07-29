const express = require("express");
const app = express();
const fs = require("fs");
const port = 3000;
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

// Magic Number Definitions
const QUEUE_REQUEST_TIMEOUT = 100; // Wait 100ms between using the queue
const EMPHERAL_DATA_SAVE = 1000 * 60; // Save Empheral data every 60s
const ONLINE_CUTOFF_TIME = 1000 * 60 * 1; // Users are online if they pinged within a minute
const AUTH_CLOUD_PROJECT = 413751680; // The scratch project that handles OAuth

// Set some defaults (required if your JSON file is empty)
const adapter = new FileSync("db.json");
const db = low(adapter);

db.defaults({
	users: {},
	analytics: {
		totalRequests: 0,
		requestsToScratch: 0,
	},
}).write();

// String replaceAll
String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, "g"), replacement);
};

// Ephemeral data

let empheralData = {
	queueAdditions: 0, // No point in saving in the database as it resets every 5 seconds
	// Saves the metric below to the database every minute
	requestsToScratch: db.get("analytics.requestsToScratch").value(),
	totalRequests: db.get("analytics.totalRequests").value(),
	inNotificationQueue: [],
	auth: Object.create(null),
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
	NotificationsPromise: 1,
	CloudDataVerification: 2,
	ProfileCommentCollector: 3,
};

let queues = [];

function addQueue(type, data) {
	const queueItem = { type: type, data: data };

	empheralData.queueAdditions++;

	switch (type) {
		case QUEUE_TYPES.Notifications:
			queues.push(queueItem);
			break;
		case QUEUE_TYPES.NotificationsPromise:
			return new Promise((resolve, reject) => {
				queueItem.resolve = resolve;
				queueItem.type = QUEUE_TYPES.Notifications;
				queues.unshift(queueItem);
			});
			break;
		case QUEUE_TYPES.CloudDataVerification:
			return new Promise((resolve, reject) => {
				queueItem.resolve = resolve;
				queueItem.reject = reject;
				queues.unshift(queueItem);
			});
			break;
		case QUEUE_TYPES.ProfileCommentCollector:
			return new Promise((resolve, reject) => {
				queueItem.resolve = resolve;
				queueItem.reject = reject;
				queues.unshift(queueItem);
			});
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
					if (data.code === "NotFound") {
						data.count = 0;
					}

					updateUser(latestQueue.data.username, {
						messages: data.count,
					});
					if (latestQueue.resolve) {
						latestQueue.resolve(data.count);
					}
				})
				.catch((err) => {
					if (latestQueue.reject) {
						latestQueue.reject(0);
					}
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
		case QUEUE_TYPES.CloudDataVerification:
			fetch(
				`https://clouddata.scratch.mit.edu/logs?projectid=${AUTH_CLOUD_PROJECT}&limit=10&offset=0`
			)
				.then((response) => response.json())
				.then((data) => {
					latestQueue.resolve(data);
				});
			empheralData.requestsToScratch++;
			break;
		case QUEUE_TYPES.ProfileCommentCollector:
			fetch(
				`https://scratch.mit.edu/site-api/comments/user/${latestQueue.data.username}/?page=${latestQueue.data.page}`
			)
				.then((response) => response.text())
				.then((data) => {
					latestQueue.resolve(data);
				});
			empheralData.requestsToScratch++;
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

app.use("/static", express.static("static"));

app.get("/", (req, res) =>
	res.send("If you do not know what this is you should not be here <3")
);

app.get("/auth/noRef", (req, res) => {
	res.send(
		'If you are seeing this it means the a site tried to use the FluffyScratch Auth but forgot to send it a "redirect" query. Please yell at them and not me'
	);
});

app.get("/auth/test", (req, res) => {
	fetch(
		`https://fluffyscratch.hampton.pw/auth/verify/v1/${req.query.username}/${req.query.publicCode}/${req.query.privateCode}/${req.query.redirectLocation}`
	)
		.then((response) => response.json())
		.then((data) => {
			res.send("Authentication result was: " + data);
		});
});

app.get(
	"/auth/verify/v1/:username/:publicCode/:privateCode/:redirectLocation",
	(req, res) => {
		req.params.redirectLocation = Buffer.from(
			req.params.redirectLocation,
			"base64"
		).toString("utf-8");

		// Return false if there is nothing saved about the user on Auth
		if (!empheralData.auth[req.params.username]) {
			res.json(false);
			return;
		}

		if (
			JSON.stringify(req.params) !=
			JSON.stringify(empheralData.auth[req.params.username])
		) {
			res.json(false);
			return;
		}

		// We are done with the empheralData Auth so delete it
		delete empheralData.auth[req.params.username];

		// Make a Queue item for CloudDataVerification
		addQueue(QUEUE_TYPES.CloudDataVerification, {
			username: req.params.username,
			publicCode: req.params.publicCode,
			res: res,
		}).then((data) => {
			for (let cloudItem of data) {
				if (
					cloudItem.user == req.params.username &&
					cloudItem.value == req.params.publicCode
				) {
					res.json(true);
					return;
				}
			}
			res.json(false);
		});
	}
);

app.get("/auth/getKeys/v1/:username", (req, res) => {
	if (!req.query.redirect) {
		req.query.redirect = "Zmx1ZmZ5c2NyYXRjaC5oYW1wdG9uLnB3L2F1dGgvbm9SZWY"; // If no redirect send them to fluffyscratch.hampton.pw/auth/noRef
	}

	const pageData = {
		username: req.params.username,
		publicCode: Math.round(Math.random() * 100000).toString(), // Turns Math.random into a relativly small number
		privateCode: (Math.random() * 100000000000000000).toString(), // Magic number that makes a Math.random an Integer
		redirectLocation: Buffer.from(req.query.redirect, "base64").toString(
			"utf-8"
		),
	};

	fs.readFile("./pages/auth.html", "utf8", function (err, authPageHTML) {
		if (err) throw err;
		for (let item in pageData) {
			authPageHTML = authPageHTML.replace(
				new RegExp(`{{${item}}}`, "g"),
				pageData[item]
			);
		}

		authPageHTML = authPageHTML.replace(
			new RegExp(`{{redirectLocationB64}}`, "g"),
			req.query.redirect
		);

		empheralData.auth[pageData.username] = pageData;
		res.send(authPageHTML);
	});
});

app.get("/notifications/v2/:username", (req, res) => {
	let username = req.params.username;

	updateUser(username, { lastKeepAlive: new Date().valueOf() });

	let queuePosition = empheralData.inNotificationQueue.indexOf(username);

	if (queuePosition === -1) {
		// Lets see if we have any cached message count
		if (getUserItem(username, "messages") === -1) {
			// If not lets make a notification queue where we put them in the front of the line
			addQueue(QUEUE_TYPES.NotificationsPromise, {
				username: username,
			}).then((messageCount) => {
				res.send({
					count: messageCount,
					timeout: 1000, // Just wait a second before making your next request, lots of love thx
					firstTime: true,
				});
			});
			return;
		}

		// Otherwise lets do a normal notification

		addQueue(QUEUE_TYPES.Notifications, {
			username: username,
		});
		empheralData.inNotificationQueue.push(username);
		queuePosition = empheralData.inNotificationQueue.indexOf(username);
	}

	res.json({
		count: getUserItem(username, "messages"),
		timeout: queuePosition * 100 + 1500,
	});
});

app.get("/profilepicture/v1/:username", (req, res) => {
	let userID = getUserItem(req.params.username, "id");

	if (userID !== -1) {
		res.redirect(
			301,
			`https://cdn2.scratch.mit.edu/get_image/user/${userID}_60x60.png`
		);
		return;
	}

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
});

const convertCommentToJSON = function (comment, head) {
	let obj = {
		username: comment.find("div.name").text().trim(),
		usernameID: comment
			.find("img.avatar")
			.attr("src")
			.split("user/")[1]
			.split("_")[0],
		commentID: comment.attr("data-comment-id"),
		date: new Date(comment.find("span.time").attr("title")).valueOf(),
		text: comment
			.find("div.content")
			.text()
			.trim()
			.replaceAll("\n      \n      \n       ", ""),
	};

	if (head) {
		obj.replies = [];
	} else {
		obj.parent = comment.find("a.reply").attr("data-parent-thread");
	}

	return obj;
};

collectCommentsFromProfile = (username, page, callback) => {
	addQueue(QUEUE_TYPES.ProfileCommentCollector, {
		username: username,
		page: page,
	})
		.then((html) => {
			const $ = cheerio.load(html);
			let comments = [];

			$("li.top-level-reply").each(function (index) {
				let elm = $(this);
				let headComment = convertCommentToJSON(
					elm.find("div.comment").first(),
					true
				);

				elm.find("ul.replies")
					.find("div.comment")
					.each((index, comment) => {
						headComment.replies.push(
							convertCommentToJSON($(comment), false)
						);
					});

				comments.push(headComment);
			});

			callback(comments);
		})
		.catch((err) => {
			callback({ err: err });
		});
};

app.get("/profilecomments/tojson/v1/:username/", (req, res) => {
	res.redirect(`/profilecomments/tojson/v1/${req.params.username}/1`);
});

app.get("/profilecomments/tojson/v1/:username/:page", (req, res) => {
	let { username, page } = req.params;

	if (isNaN(Number(page)) || Number(page) <= 0 || Number(page) >= 68) {
		res.json({
			error:
				"Page number is invalid, page numbers must be a valid number between 1 and 67",
		});
		return;
	}

	collectCommentsFromProfile(username, page, (data) => {
		res.json(data);
	});
});

app.get("/profilecomments/stats/v1/:username/", (req, res) => {
	const { username } = req.params;
	collectCommentsFromProfile(username, 1, (comments) => {
		if (comments.length === 0) {
			res.json({ err: "User has no comments :(" });
		}
		let stats = {
			username: username,
		};

		let oldestComment = 10 ** 40;
		for (let comment of comments) {
			if (comment.date < oldestComment) {
				oldestComment = comment.date;
			}
		}

		stats.milisecondsPerComment =
			(new Date().valueOf() - oldestComment) / comments.length;

		res.json(stats);
	});
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

// app.get("/showusers/v1/", (req, res) => {
// 	res.json(getActiveUsers());
// });

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

app.listen(port, () =>
	console.log(`Example app listening at http://localhost:${port}`)
);

// Go brrrr
