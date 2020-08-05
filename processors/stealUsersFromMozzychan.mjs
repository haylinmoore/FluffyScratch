import { User } from "../modules/db.mjs";
import fetch from "node-fetch";

const userMozzToDBUser = (user) => {
	return {
		username: user.info.username,
		id: user.info.scratch_id,
	};
};

const threads = 16;
const page = 0;

function collectUsersFromPage(page) {
	console.log("On page " + page);
	if (page > 500) {
		return;
	}
	fetch("https://scratchdb.lefty.one/v2/user/rank/global/followers/" + page)
		.then((response) => response.json())
		.then((data) => {
			let users = [];
			for (let user of data.users) {
				if (user.scratch_id !== null) {
					users.push(userMozzToDBUser(user));
				}
			}

			User.bulkCreate(users, { updateOnDuplicate: ["username"] })
				.then(() => {
					collectUsersFromPage(page + threads);
				})
				.catch((err) => {
					console.log(err);
				});
		});
}

for (let i = 0; i < threads; i++) {
	collectUsersFromPage(page + i);
}
