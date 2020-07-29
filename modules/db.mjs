import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync.js";

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

db.createUser = function (data) {
	if (!data.hasOwnProperty("username")) {
		throw "CreateUser: requires a username";
	}
	return {
		username: data.username || "",
		id: data.id || -1,
		lastKeepAlive: data.lastKeepAlive || 0,
		messages: data.messages || -1,
	};
};

db.updateUser = function (username, newData) {
	let user = db.get(`users.${username}`);

	if (user.value() === undefined) {
		db.set(
			`users.${username}`,
			db.createUser({ ...newData, username: username })
		).write();
	} else {
		db.set(`users.${username}`, {
			...user.value(),
			...newData,
		}).write();
	}
};

db.getUserItem = function (username, item) {
	return db.get(`users.${username}.${item}`).value();
};

export default db;
