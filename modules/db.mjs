import Sequelize from "sequelize";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { GET_USER_IDS } from "./consts.mjs";
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

setInterval(() => {
	User.findAll({ where: { id: -1 } }).then((users) => {
		users.forEach((user) => {
			fetch(
				"https://scratchdb.lefty.one/v2/user/info/" +
					user.get("username")
			)
				.then((response) => response.json())
				.then((data) => {
					if (data.error === "notfound") {
						user.destroy();
						return;
					} else if (user.id == null) {
						data.id = 0;
					}
					user.set("id", data.id);
					user.save();
				})
				.catch((err) => {
					console.log(err);
				});
		});
	});
}, GET_USER_IDS);

export { User, Analytic };
