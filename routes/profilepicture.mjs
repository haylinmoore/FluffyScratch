import express from "express";
import { User } from "../modules/db.mjs";
import fetch from "node-fetch";
import {isValidName} from "../modules/funcs.mjs";


var router = express.Router();

router.get("/v1/:username", (req, res) => {

	if (!isValidName(req.params.username)){
		res.json({error: "The username supplied is not a valid scratch username"})
		return;
	}
	
	User.findOrCreate({
		where: { username: req.params.username },
		defaults: { username: req.params.username },
	}).then(([user, created]) => {
		if (!created) {
			res.redirect(
				302,
				`https://cdn2.scratch.mit.edu/get_image/user/${user.id}_60x60.png`
			);
		}

		fetch("https://scratchdb.lefty.one/v2/user/info/" + req.params.username)
			.then((response) => response.json())
			.then((data) => {
				res.redirect(
					302,
					`https://cdn2.scratch.mit.edu/get_image/user/${data.id}_60x60.png`
				);
				user.id = data.id;
				user.save();
			})
			.catch((err) => {
				res.send("brrrr");
			});
	});
});

export default router;
