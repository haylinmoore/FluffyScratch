import express from "express";
import queue from "../modules/queue.mjs";
import cheerio from "cheerio";

var router = express.Router();

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
		.add(queue.TYPES.ProfileCommentCollector, {
			username: username,
			page: page,
		})
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
	});
});

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

export default router;
