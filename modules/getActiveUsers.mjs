import db from "./db.mjs";
import { ONLINE_CUTOFF_TIME } from "./consts.mjs";

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

export default getActiveUsers;
