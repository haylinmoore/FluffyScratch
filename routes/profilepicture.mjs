import express from "express";
import db from "../modules/db.mjs";
import fetch from "node-fetch";

var router = express.Router();

router.get("/v1/:username", (req, res) => {
	let userID = db.getUserItem(req.params.username, "id");

	if (userID !== -1) {
		res.redirect(
			301,
			`https://cdn2.scratch.mit.edu/get_image/user/${userID}_60x60.png`
		);
		return;
	}

	fetch("https://scratchdb.lefty.one/v2/user/info/" + req.params.username)
		.then((response) => response.json())
		.then((data) => {
			res.redirect(
				301,
				`https://cdn2.scratch.mit.edu/get_image/user/${data.id}_60x60.png`
			);
			db.updateUser(req.params.username, { id: data.id });
		})
		.catch((err) => {
			res.send("brrrr");
		});
});

export default router;
