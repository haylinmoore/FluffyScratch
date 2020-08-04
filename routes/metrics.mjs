import express from "express";
import { User, Analytic, Comment } from "../modules/db.mjs";
import Sequelize from "sequelize";
const Op = Sequelize.Op;
import queue from "../modules/queue.mjs";
import { ONLINE_CUTOFF_TIME } from "../modules/consts.mjs";
import empheralData from "../modules/empheralData.mjs";
var router = express.Router();

router.get("/", (req, res) => {
	let timestamp = new Date().getTime();

	let userCount = User.count();
	let requestsToScratch = Analytic.findOne({
		where: { name: "requestsToScratch" },
	});
	let totalRequests = Analytic.findOne({
		where: { name: "totalRequests" },
	});
	let activeUsers = User.count({
		where: {
			lastKeepAlive: {
				[Op.gte]: new Date().valueOf() - ONLINE_CUTOFF_TIME,
			},
		},
	});
	let totalComments = Comment.count();

	Promise.all([
		userCount,
		requestsToScratch,
		totalRequests,
		activeUsers,
		totalComments,
	]).then(
		([
			userCount,
			requestsToScratch,
			totalRequests,
			activeUsers,
			totalComments,
		]) => {
			let metricData = `
# HELP scratch_proxy_request_total The total number of HTTP requests.
# TYPE scratch_proxy_request_total counter
scratch_proxy_request_total ${totalRequests.value} ${timestamp}
# HELP scratch_proxy_queue_since The amount of additions to the queue since the last time prometheus checked
scratch_proxy_queue_since ${empheralData.queueAdditions} ${timestamp}
# HELP scratch_proxy_users_served Total users served
# TYPE scratch_proxy_users_served gauge
scratch_proxy_users_served ${userCount} ${timestamp}
# HELP scratch_proxy_active_users Total active users
# TYPE scratch_proxy_active_users gauge
scratch_proxy_active_users ${activeUsers} ${timestamp}
# HELP scratch_proxy_asap_queue ASAP queue size
# TYPE scratch_proxy_asap_queue gauge
scratch_proxy_asap_queue ${queue.queues.asap.length} ${timestamp}
# HELP scratch_proxy_ehhh_queue EHHH queue size
# TYPE scratch_proxy_ehhh_queue gauge
scratch_proxy_ehhh_queue ${queue.queues.ehhh.length} ${timestamp}
# HELP scratch_proxy_idrc_queue IDRC queue size
# TYPE scratch_proxy_idrc_queue gauge
scratch_proxy_idrc_queue ${queue.queues.idrc.length} ${timestamp}
# HELP scratch_proxy_reqs_to_scratch Total requests to Scratch
# TYPE scratch_proxy_reqs_to_scratch counter
scratch_proxy_reqs_to_scratch ${requestsToScratch.value} ${timestamp}
# HELP scratch_proxy_total_comments Total comments collected
# TYPE scratch_proxy_total_comments counter
scratch_proxy_total_comments ${totalComments} ${timestamp}
		`;

			res.send(metricData);

			empheralData.queueAdditions = 0;
		}
	);
});

export default router;
