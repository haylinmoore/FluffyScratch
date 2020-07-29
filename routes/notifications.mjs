import express from "express";
import db from "../modules/db.mjs";
import queue from "../modules/queue.mjs";
import { QUEUE_ITEMS_PER_SECOND } from "../modules/consts.mjs";
import empheralData from "../modules/empheralData.mjs";

var router = express.Router();

const handleNotificationRequest = (res, username, queueType) => {
	db.updateUser(username, { lastKeepAlive: new Date().valueOf() });

	let queuePosition = queueType.findIndex((item) => {
		item.data.username === username;
	});

	if (queuePosition === -1) {
		// Lets see if we have any cached message count
		if (db.getUserItem(username, "messages") === -1) {
			// If not lets make a notification queue where we put them in the front of the line
			queue
				.add(
					queue.TYPES.Notifications,
					{
						username: username,
					},
					queue.queues.asap
				)
				.then((messageCount) => {
					res.send({
						count: messageCount,
						timeout: 1000, // Just wait a second before making your next request, lots of love thx
						firstTime: true,
					});
				})
				.catch((err) => {
					console.log(err);
				});
			return;
		}

		// Otherwise lets do a normal notification

		queue.add(
			queue.TYPES.Notifications,
			{
				username: username,
			},
			queueType
		);

		queuePosition = queueType.length;
	}
	let timeout = queuePosition;

	if (queueType === queue.queues.idrc) {
		timeout += queue.queues.ehhh.length;
	}

	timeout *= 1000 / QUEUE_ITEMS_PER_SECOND;
	timeout += 1500;

	res.json({
		count: db.getUserItem(username, "messages"),
		timeout: timeout,
	});
};

router.get("/v2/:username", (req, res) => {
	handleNotificationRequest(res, req.params.username, queue.queues.ehhh);
});

router.get("/v2/:username/alt", (req, res) => {
	handleNotificationRequest(res, req.params.username, queue.queues.idrc);
});

export default router;
