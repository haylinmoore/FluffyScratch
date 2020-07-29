import db from "./db.mjs";
import { EMPHERAL_DATA_SAVE } from "./consts.mjs";

let empheralData = {
	queueAdditions: 0, // No point in saving in the database as it resets every 5 seconds
	// Saves the metric below to the database every minute
	requestsToScratch: db.get("analytics.requestsToScratch").value(),
	totalRequests: db.get("analytics.totalRequests").value(),
	inNotificationQueue: [],
	auth: Object.create(null),
};

setInterval(() => {
	db.set("analytics.totalRequests", empheralData.totalRequests)
		.set("analytics.requestsToScratch", empheralData.requestsToScratch)
		.write();
}, EMPHERAL_DATA_SAVE);

export default empheralData;
