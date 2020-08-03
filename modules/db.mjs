import Sequelize from "sequelize";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { GET_USER_IDS } from "./consts.mjs";
import queue from "./queue.mjs";
dotenv.config();

const sequelize = new Sequelize(
	process.env.DB_DATABASE || "fluffyscratch",
	process.env.DB_USERNAME || "root",
	process.env.DB_PASSWORD || "localtesting",
	{
		host: process.env.DB_HOST || "localhost",
		dialect: process.env.DB_CONNECTION || "mysql",
		logging: false,
	}
);

sequelize
	.authenticate()
	.then(() => {
		console.log("Connection has been established successfully.");
	})
	.catch((err) => {
		console.error("Unable to connect to the database:", err);
	});

const User = sequelize.define("user", {
	username: {
		type: Sequelize.STRING,
		primaryKey: true,
	},
	id: {
		type: Sequelize.INTEGER,
		defaultValue: -1,
	},
	lastKeepAlive: {
		type: Sequelize.BIGINT,
		defaultValue: -1,
	},
	messages: {
		type: Sequelize.INTEGER,
		defaultValue: -1,
	},
	lastScrape: {
		type: Sequelize.BIGINT,
		defaultValue: -1,
	},
	nextScrape: {
		type: Sequelize.BIGINT,
		defaultValue: -1,
	},
	scanning: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},
	fullScanned: {
		type: Sequelize.BOOLEAN,
		defaultValue: false,
	},
});

User.sync({ force: false, alter: true })
	.then(() => {})
	.catch((err) => {
		console.error(err);
	});

const Analytic = sequelize.define("analytic", {
	name: {
		type: Sequelize.STRING,
		primaryKey: true,
	},
	value: {
		type: Sequelize.INTEGER,
	},
});

Analytic.sync({ force: false, alter: true })
	.then(() => {
		Analytic.findOrCreate({
			where: { name: "totalRequests" },
			defaults: {},
		});
		Analytic.findOrCreate({
			where: { name: "requestsToScratch" },
			defaults: {},
		});
	})
	.catch((err) => {
		console.error(err);
	});

/* 
"username": "Chiroyce",
        "usernameID": "58524660",
        "commentID": "86697819",
        "date": 1596294692000,
        "text": "@_RareScratch2_ He doesn’t do F4F.",
		"parent": "86697361"
		*/

const Comment = sequelize.define("comment", {
	username: {
		type: Sequelize.STRING,
	},
	commentID: {
		type: Sequelize.INTEGER,
		primaryKey: true,
	},
	date: {
		type: Sequelize.BIGINT,
	},
	text: {
		type: Sequelize.STRING(2048),
	},
	parentID: {
		type: Sequelize.INTEGER,
	},
	profile: {
		type: Sequelize.STRING,
	},
});

Comment.sync({ force: false, alter: true })
	.then(() => {})
	.catch((err) => {
		console.error(err);
	});

function syncIDs() {
	User.findAll({ where: { id: -1 } }).then((users) => {
		users.forEach((user) => {
			fetch(
				"https://scratchdb.lefty.one/v2/user/info/" +
					user.get("username")
			)
				.then((response) => response.json())
				.then((data) => {
					if (data.error === "notfound" || data.id == null) {
						queue
							.add(
								queue.TYPES.GetUserProfile,
								{
									username: user.get("username"),
								},
								queue.queues.idrc
							)
							.then((profile) => {
								if (profile.code === "NotFound") {
									user.destroy();
								} else {
									user.set("id", profile.id);
									user.save();
								}
							});
						return;
					} else {
						user.set("id", data.id);
						user.save();
					}
				})
				.catch((err) => {
					console.log(err);
				});
		});
	});
}

setInterval(syncIDs, GET_USER_IDS);
setTimeout(syncIDs, 1000);

export { User, Analytic, Comment };
