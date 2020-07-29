import express from "express";
import db from "../modules/db.mjs";
import empheralData from "../modules/empheralData.mjs";
import getActiveUsers from "../modules/getActiveUsers.mjs";

var router = express.Router();

router.get("/", (req, res) => {
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

export default router;
