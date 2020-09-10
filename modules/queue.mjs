import fetch from "node-fetch";
import empheralData from "./empheralData.mjs";
import {
	QUEUE_ITEMS_PER_SECOND,
	AUTH_CLOUD_PROJECT,
	EHHH_ITEMS_PER_SECOND,
} from "./consts.mjs";
import { User, Analytic } from "../modules/db.mjs";

let queue = {
	queues: {
		// Only 10 queue items can be handled a second
		asap: [], // Do as many as possible up to 10
		ehhh: [], // Do up to 7 or till there have been 10 items total
		idrc: [], // Do however many is you can till it hits 10 items total
	},
	queueItemsProcessed: 0,
	ehhhItemsProcessed: 0,
};

queue.TYPES = {
	Notifications: 0,
	GetUserProfile: 1,
	CloudDataVerification: 2,
	ProfileCommentCollector: 3,
};

queue.add = function (type, data, placement) {
	const queueItem = { type: type, data: data };

	empheralData.queueAdditions++;

	return new Promise((resolve, reject) => {
		queueItem.resolve = resolve;
		placement.push(queueItem);
	});
};

setInterval(() => {
	if (queue.queueItemsProcessed >= QUEUE_ITEMS_PER_SECOND) {
		queue.queueItemsProcessed = 0;
		queue.ehhhItemsProcessed = 0;
	}

	let latestQueue;

	if (queue.queues.asap.length > 0) {
		latestQueue = queue.queues.asap.shift();
	} else if (
		queue.ehhhItemsProcessed < EHHH_ITEMS_PER_SECOND ||
		queue.queues.idrc.length === 0
	) {
		latestQueue = queue.queues.ehhh.shift();
		queue.ehhhItemsProcessed++;
	} else {
		latestQueue = queue.queues.idrc.shift();
	}

	queue.queueItemsProcessed++;

	if (latestQueue == undefined) {
		return;
	}

	Analytic.increment("value", { where: { name: "requestsToScratch" } });

	switch (latestQueue.type) {
		case queue.TYPES.Notifications:
			fetch(
				`https://api.scratch.mit.edu/users/${latestQueue.data.username}/messages/count?` +
				Math.random()
			)
				.then((response) => response.json())
				.then((data) => {
					if (data.code === "NotFound") {
						data.count = 0;
					}

					User.update(
						{ messages: data.count },
						{
							where: {
								username: latestQueue.data.username,
							},
						}
					);

					latestQueue.resolve(data.count);
				});
			break;
		case queue.TYPES.CloudDataVerification:
			fetch(
				`https://clouddata.scratch.mit.edu/logs?projectid=${AUTH_CLOUD_PROJECT}&limit=10&offset=0`
			)
				.then((response) => response.json())
				.then((data) => {
					latestQueue.resolve(data);
				});
			break;
		case queue.TYPES.GetUserProfile:
			fetch(
				`https://api.scratch.mit.edu/users/${latestQueue.data.username}/`
			)
				.then((response) => response.json())
				.then((data) => {
					latestQueue.resolve(data);
				});
		case queue.TYPES.ProfileCommentCollector:
			fetch(
				`https://scratch.mit.edu/site-api/comments/user/${latestQueue.data.username}/?page=${latestQueue.data.page}`
			)
				.then((response) => response.text())
				.then((data) => {
					latestQueue.resolve(data);
				});
			break;

		case undefined:
			break;
	}
}, 1000 / QUEUE_ITEMS_PER_SECOND);

export default queue;
