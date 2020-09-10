import express from "express";
import { User } from "../modules/db.mjs";
import fetch from "node-fetch";
import { isValidName } from "../modules/funcs.mjs";
import getUserID from "../modules/getUserID.mjs";

var router = express.Router();

router.get("/v1/:username", (req, res) => {

	if (!isValidName(req.params.username)) {
		res.json({ error: "The username supplied is not a valid scratch username" })
		return;
	}

	getUserID(req.params.username).then((data) => {
		res.redirect(
			302,
			`https://cdn2.scratch.mit.edu/get_image/user/${data}_60x60.png`
		);
	}).catch(() => {
		res.redirect(
			302,
			`https://cdn2.scratch.mit.edu/get_image/user/default_60x60.png`
		);
	})

});

export default router;
