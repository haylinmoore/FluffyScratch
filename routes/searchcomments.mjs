import express from "express";
import dotenv from "dotenv";
import { Comment } from "../modules/db.mjs";

dotenv.config();

var router = express.Router();

router.get("/findBy/parentID/:parentID", (req, res) => {
	Comment.findAll({
		where: {
			parentID: req.params.parentID,
		},
	}).then((data) => {
		res.json(data);
	});
});

export default router;
