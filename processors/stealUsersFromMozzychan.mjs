import { User } from "../modules/db.mjs";
import fetch from "node-fetch";

const userMozzToDBUser = (user) => {
	return {
		username: user.info.username,
		id: user.info.scratch_id,
	};
};

const threads = 32;
const page = 0;

function collectUsersFromPage(page) {
	console.log("On page " + page);
	fetch("https://scratchdb.lefty.one/v2/user/rank/global/comments/" + page)
		.then((response) => response.json())
		.then((data) => {
			if (data.users.length === 0) {
				return;
			}
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
