import express from "express";
import queue from "../modules/queue.mjs";
import cheerio from "cheerio";
import dotenv from "dotenv";
import fetch from "node-fetch";
import Sequelize from "sequelize";
import { SCAN_PROFILES } from "../modules/consts.mjs";
import { Comment } from "../modules/db.mjs";

dotenv.config();

var router = express.Router();

import searchcomments from "./searchcomments.mjs";
import { User } from "../modules/db.mjs";
import e from "express";
router.use("/search", searchcomments);

const convertCommentToJSON = function (comment, head) {
	let obj = {
		username: comment.find("div.name").text().trim(),
		usernameID: comment
			.find("img.avatar")
			.attr("src")
			.split("user/")[1]
			.split("_")[0],
		commentID: comment.attr("data-comment-id"),
		date: new Date(comment.find("span.time").attr("title")).valueOf(),
		text: comment
			.find("div.content")
			.text()
			.trim()
			.replaceAll("\n      \n      \n       ", "")
			.substring(0, 1024),
	};

	if (head) {
		obj.replies = [];
	} else {
		obj.parent = comment.find("a.reply").attr("data-parent-thread");
	}

	return obj;
};

const collectCommentsFromProfile = (username, page, callback) => {
	queue
		.add(
			queue.TYPES.ProfileCommentCollector,
			{
				username: username,
				page: page,
			},
			queue.queues.asap
		)
		.then((html) => {
			const $ = cheerio.load(html);
			let comments = [];

			$("li.top-level-reply").each(function (index) {
				let elm = $(this);
				let headComment = convertCommentToJSON(
					elm.find("div.comment").first(),
					true
				);

				elm.find("ul.replies")
					.find("div.comment")
					.each((index, comment) => {
						headComment.replies.push(
							convertCommentToJSON($(comment), false)
						);
					});

				comments.push(headComment);
			});

			callback(comments);
		});
};

router.get("/tojson/v1/:username/", (req, res) => {
	res.redirect(`/profilecomments/tojson/v1/${req.params.username}/1`);
});

router.get("/tojson/v1/:username/:page", (req, res) => {
	let { username, page } = req.params;

	if (isNaN(Number(page)) || Number(page) <= 0 || Number(page) >= 68) {
		res.json({
			error:
				"Page number is invalid, page numbers must be a valid number between 1 and 67",
		});
		return;
	}

	collectCommentsFromProfile(username, page, (data) => {
		res.json(data);

		for (let thread of data) {
			saveCommentToDB(thread, username);
			for (let child of thread.replies) {
				saveCommentToDB(child, username);
			}
		}
	});
});

function saveCommentToDB(comment, profile) {
	Comment.upsert(
		{
			username: comment.username,
			date: comment.date,
			text: comment.text,
			parentID: comment.parent || comment.commentID,
			profile: profile,
			commentID: comment.commentID,
		},
		{
			where: {
				commentID: comment.commentID,
			},
		}
	)
		.then(() => {})
		.catch((err) => {
			console.log(err);
		});
}

function getStats(profile) {
	return new Promise((resolve, reject) => {
		let oldestComment = Comment.min("date", {
			where: {
				profile,
			},
		});

		let commentCount = Comment.count({
			where: {
				profile,
			},
		});

		let topCommentors = Comment.findAll({
			attributes: [
				[Sequelize.fn("COUNT", Sequelize.col("username")), "count"],
				"username",
			],
			group: "username",
			where: {
				profile: profile,
			},
			order: [Sequelize.literal("count DESC")],
			limit: 5,
		});

		Promise.all([oldestComment, commentCount, topCommentors])
			.then(([oldestComment, commentCount, topCommentors]) => {
				resolve({
					oldestComment,
					commentCount,
					milisecondsPerComment:
						(new Date().valueOf() - oldestComment) / commentCount,
					topCommentors,
				});
			})
			.catch((err) => {
				console.log(err);
				reject(err);
			});
	});
}

router.get("/stats/v1/:profile/", (req, res) => {
	getStats(req.params.profile).then((data) => {
		res.json(data);
	});
});

router.get("/scrapeuser/v1/:username", (req, res) => {
	const username = req.params.username;
	User.findOrCreate({
		where: { username: username },
		defaults: {
			username: username,
		},
	}).then(([user, created]) => {
		if (user.nextScrape < new Date().valueOf()) {
			scrapWholeProfile(username, 1, res);
		} else {
			res.json({
				msg: `${username} was already scraped on ${new Date(
					user.lastScrape
				)}, next scrape is at ${new Date(user.nextScrape)}`,
				nextScrape: user.nextScrape,
				lastScrape: user.lastScrape,
			});
		}
	});
});

function scanProfiles() {
	if (process.env.DEPLOYED) {
		fetch("https://scratchdb.lefty.one/v2/user/rank/global/comments")
			.then((response) => response.json())
			.then((data) => {
				let users = data.users;

				for (let i = 0; i < 30; i++) {
					let username = users[i].info.username;
					collectCommentsFromProfile(username, 1, (data) => {
						for (let thread of data) {
							saveCommentToDB(thread, username);
							for (let child of thread.replies) {
								saveCommentToDB(child, username);
							}
						}
					});
				}
			});
	}
}

scanProfiles();

function scrapWholeProfile(username, currentPage, res) {
	if (currentPage >= 68) {
		scrapeFinished(username, res);
		return;
	} else if (currentPage === 0) {
		currentPage++;
	}

	for (let i = 0; i < 10; i++) {
		let newPage = currentPage + i;
		if (newPage >= 68) {
			break;
		}
		collectCommentsFromProfile(username, newPage, (data) => {
			if (data.length > 0) {
				for (let thread of data) {
					saveCommentToDB(thread, username);
					for (let child of thread.replies) {
						saveCommentToDB(child, username);
					}
				}
				if (newPage % 10 === 0) {
					scrapWholeProfile(username, newPage + 10, res);
				}
			} else if (newPage % 10 == 9) {
				scrapeFinished(username, res);
			}
		});
	}
}

function scrapeFinished(username, res) {
	getStats(username).then((stats) => {
		const date = new Date().valueOf();
		User.update(
			{
				lastScrape: date,
				nextScrape: date + stats.milisecondsPerComment * 20,
			},
			{
				where: {
					username: username,
				},
			}
		).then((user) => {
			res.json({
				msg: `The scrape on the users profile ${username} has finished :)`,
				nextScrape: user.nextScrape,
				lastScrape: user.lastScrape,
			});
		});
	});
}

setInterval(scanProfiles, SCAN_PROFILES);

export default router;
