const express = require("express");
const app = express();
const port = 3000;
const axios = require("axios");
const fetch = require("node-fetch");

var reqsPerSecond = 0;
var queue = [];
var notifications = Object.create(null);

var analytics = {
	longestQueue: 0,
	totalReqs: 0,
	reqsToScratch: 0,
	queueSizeSinceLast: 0,
	referrers: new Map(),
	users: new Map(),
	queues: 0,
};

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	next();
	if (req.originalUrl != "/metrics") {
		analytics.totalReqs++;
		let ref = req.get("Referrer") || "https://localhost";
		ref = ref.split("://")[1].split("/")[0];

		let val = 1;
		if (analytics.referrers.has(ref)) {
			val = analytics.referrers.get(ref) + 1;
		}

		analytics.referrers.set(ref, val);
	}
});

app.get("/", (req, res) =>
	res.send("If you do not know what this is you should not be here <3")
);

app.get("/maxqueue/v1/", (req, res) => {
	res.json({ longestQueue: analytics.longestQueue });
});

const getActiveUsers = () => {
	let currentDate = new Date().valueOf();
	const cutoff = 1000 * 60 * 1;

	return Array.from(analytics.users.entries())
		.filter((data) => {
			return currentDate - data[1] < cutoff;
		})
		.map((data) => {
			return data[0];
		});
};

app.get("/showusers/v1/hiddenkey6940", (req, res) => {
	res.json(getActiveUsers());
});

app.get("/profilepicture/v1/:username", (req, res) => {
	fetch("https://scratchdb.lefty.one/v2/user/info/" + req.params.username)
		.then((response) => response.json())
		.then((data) => {
			res.redirect(
				301,
				`https://cdn2.scratch.mit.edu/get_image/user/${data.id}_60x60.png`
			);
		})
		.catch((err) => {
			res.send("brrrr");
		});
});

app.get("/metrics", (req, res) => {
	let timestamp = new Date().getTime();

	let metricData = `
# HELP scratch_proxy_request_total The total number of HTTP requests.
# TYPE scratch_proxy_request_total counter
scratch_proxy_request_total ${analytics.totalReqs} ${timestamp}

# HELP scratch_proxy_queue_since The amount of additions to the queue since the last time prometheus checked
scratch_proxy_queue_since ${analytics.queueSizeSinceLast} ${timestamp}

# HELP scratch_proxy_longest_queue The longest queue
scratch_proxy_longest_queue ${analytics.longestQueue} ${timestamp}

# HELP scratch_proxy_queues_total The total queues
# TYPE scratch_proxy_queues_total counter
scratch_proxy_queues_total ${analytics.queues} ${timestamp}

# HELP scratch_proxy_users_served Total users served
# TYPE scratch_proxy_users_served counter
scratch_proxy_users_served ${analytics.users.size} ${timestamp}

# HELP scratch_proxy_active_users Total active users
# TYPE scratch_proxy_active_users gauge
scratch_proxy_active_users ${getActiveUsers().length} ${timestamp}

# HELP scratch_proxy_reqs_to_scratch Total requests to Scratch
# TYPE scratch_proxy_reqs_to_scratch counter
scratch_proxy_reqs_to_scratch ${analytics.reqsToScratch} ${timestamp}

# HELP scratch_proxy_referrers Shows reqs by referrer
# TYPE scratch_proxy_referrers counter`;

	for (const [site, reqs] of analytics.referrers.entries()) {
		metricData += `\nscratch_proxy_referrers{site="${site}"} ${reqs} ${timestamp}`;
	}

	res.send(metricData);

	analytics.queueSizeSinceLast = 0;
});

app.get("/notifications/v1/:name", (req, res) => {
	res.json({
		error:
			"This API endpoint has become deprecated, please switch to v2. Note that v2 requires a much more frequent requests around one every five seconds and returns a -1 until it has gotten and cached the users message count",
	});
	// if (reqsPerSecond <= 9) {
	// 	axios
	// 		.get(
	// 			"https://api.scratch.mit.edu/users/" +
	// 				req.params.name +
	// 				"/messages/count?" +
	// 				Date.now().toString()
	// 		)
	// 		.then((response) => res.json(response.data));
	// 	reqsPerSecond++;
	// } else {
	// 	res.status(429).send(
	// 		"The server has gotten to many requests this second"
	// 	);
	// }
});

app.get("/notifications/v2/:name", (req, res) => {
	let name = req.params.name;

	analytics.users.set(name, new Date().valueOf());

	if (queue.indexOf(name) === -1) {
		queuePush(name);
	}

	res.json({
		count: notifications[name] != undefined ? notifications[name] : -1,
	});
});

app.get("/notifications/v3/:names", (req, res) => {
	let names = req.params.names.split(",");

	let response = Object.create(null);

	for (let name of names) {
		if (queue.indexOf(name) === -1) {
			queuePush(name);
		}

		response[name] =
			notifications[name] != undefined ? notifications[name] : -1;
	}

	res.json(response);
});

setInterval(function () {
	if (queue.length > analytics.longestQueue) {
		analytics.longestQueue = queue.length;
		console.log(
			`Longest queue length is ${analytics.longestQueue} at ${new Date()}`
		);
	}

	if (queue.length > 0 && reqsPerSecond <= 9) {
		let name = queue.shift();
		reqsPerSecond++;
		analytics.reqsToScratch++;
		axios
			.get(
				"https://api.scratch.mit.edu/users/" +
					name +
					"/messages/count?" +
					Date.now().toString()
			)
			.then((response) => {
				notifications[name] = response.data.count;
			});
	}
}, 100);

function queuePush(name) {
	analytics.queueSizeSinceLast++;
	analytics.queues++;
	queue.push(name);
}

setInterval(function () {
	reqsPerSecond = 0;
}, 1000);

app.listen(port, () =>
	console.log(`Example app listening at http://localhost:${port}`)
);

// Go brrrr
