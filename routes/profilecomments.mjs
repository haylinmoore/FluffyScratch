import express from "express";
import queue from "../modules/queue.mjs";
import cheerio from "cheerio";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { SCAN_PROFILES } from "../modules/consts.mjs";
import { Comment } from "../modules/db.mjs";

dotenv.config();

var router = express.Router();

import searchcomments from "./searchcomments.mjs";
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
			.replaceAll("\n      \n      \n       ", ""),
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

router.get("/stats/v1/:username/", (req, res) => {
	const { username } = req.params;
	collectCommentsFromProfile(username, 1, (comments) => {
		if (comments.length === 0) {
			res.json({ err: "User has no comments :(" });
		}
		let stats = {
			username: username,
		};

		let oldestComment = 10 ** 40;
		for (let comment of comments) {
			if (comment.date < oldestComment) {
				oldestComment = comment.date;
			}
		}

		stats.milisecondsPerComment =
			(new Date().valueOf() - oldestComment) / comments.length;

		res.json(stats);
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

setInterval(scanProfiles, SCAN_PROFILES);

export default router;
