import express from "express";
import db from "../modules/db.mjs";
import queue from "../modules/queue.mjs";
import empheralData from "../modules/empheralData.mjs";

var router = express.Router();

router.get("/v2/:username", (req, res) => {
	let username = req.params.username;

	db.updateUser(username, { lastKeepAlive: new Date().valueOf() });

	let queuePosition = empheralData.inNotificationQueue.indexOf(username);

	if (queuePosition === -1) {
		// Lets see if we have any cached message count
		if (db.getUserItem(username, "messages") === -1) {
			// If not lets make a notification queue where we put them in the front of the line
			queue
				.add(queue.TYPES.NotificationsPromise, {
					username: username,
				})
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

		queue.add(queue.TYPES.Notifications, {
			username: username,
		});
		empheralData.inNotificationQueue.push(username);
		queuePosition = empheralData.inNotificationQueue.indexOf(username);
	}

	res.json({
		count: db.getUserItem(username, "messages"),
		timeout: queuePosition * 100 + 1500,
	});
});

export default router;
