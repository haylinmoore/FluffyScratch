import fetch from "node-fetch";
import empheralData from "./empheralData.mjs";
import { QUEUE_REQUEST_TIMEOUT, AUTH_CLOUD_PROJECT } from "./consts.mjs";
import db from "../modules/db.mjs";

let queue = {};

queue.TYPES = {
	Notifications: 0,
	NotificationsPromise: 1,
	CloudDataVerification: 2,
	ProfileCommentCollector: 3,
};

let queues = [];

queue.add = function (type, data) {
	const queueItem = { type: type, data: data };

	empheralData.queueAdditions++;

	switch (type) {
		case queue.TYPES.Notifications:
			queues.push(queueItem);
			break;
		case queue.TYPES.NotificationsPromise:
			return new Promise((resolve, reject) => {
				queueItem.resolve = resolve;
				queueItem.type = queue.TYPES.Notifications;
				queues.unshift(queueItem);
			});
			break;
		case queue.TYPES.CloudDataVerification:
			return new Promise((resolve, reject) => {
				queueItem.resolve = resolve;
				queueItem.reject = reject;
				queues.unshift(queueItem);
			});
			break;
		case queue.TYPES.ProfileCommentCollector:
			return new Promise((resolve, reject) => {
				queueItem.resolve = resolve;
				queueItem.reject = reject;
				queues.unshift(queueItem);
			});
			break;
		default:
			throw `ILLEGAL QUEUE TYPE OF ${type}`;
	}
};

setInterval(() => {
	let latestQueue = queues.shift();

	if (latestQueue == undefined) {
		return;
	}

	switch (latestQueue.type) {
		case queue.TYPES.Notifications:
			fetch(
				`https://api.scratch.mit.edu/users/${latestQueue.data.username}/messages/count`
			)
				.then((response) => response.json())
				.then((data) => {
					if (data.code === "NotFound") {
						data.count = 0;
					}

					db.updateUser(latestQueue.data.username, {
						messages: data.count,
					});
					if (latestQueue.resolve) {
						latestQueue.resolve(data.count);
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
		case queue.TYPES.CloudDataVerification:
			fetch(
				`https://clouddata.scratch.mit.edu/logs?projectid=${AUTH_CLOUD_PROJECT}&limit=10&offset=0`
			)
				.then((response) => response.json())
				.then((data) => {
					latestQueue.resolve(data);
				});
			empheralData.requestsToScratch++;
			break;
		case queue.TYPES.ProfileCommentCollector:
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

export default queue;
