import express from "express";
import dotenv from "dotenv";
import Sequelize from "sequelize";
const Op = Sequelize.Op;
import { Comment } from "../modules/db.mjs";

dotenv.config();

var router = express.Router();

router.get("/findby/parentID/:parentID", (req, res) => {
	Comment.findAll({
		where: {
			parentID: req.params.parentID,
		},
	}).then((data) => {
		res.json(data);
	});
});

// router.get("/findby/text/:text/:page", (req, res) => {
// 	let page = req.params.page;
// 	if (page < 0) {
// 		page = 0;
// 	}
// 	Comment.findAll({
// 		where: {
// 			text: { [Op.like]: `%${req.params.text}%` },
// 		},
// 		offset: page * 30,
// 		limit: 30,
// 	}).then((data) => {
// 		res.json(data);
// 	});
// });

export default router;
