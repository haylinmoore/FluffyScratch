import express from "express";
import fetch from "node-fetch";
import queue from "../modules/queue.mjs";
import empheralData from "../modules/empheralData.mjs";
import fs from "fs";
import {isValidName} from "../modules/funcs.mjs";

var router = express.Router();

// String replaceAll
String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, "g"), replacement);
};

router.get("/noRef", (req, res) => {
	res.send(
		'If you are seeing this it means the a site tried to use the FluffyScratch Auth but forgot to send it a "redirect" query. Please yell at them and not me'
	);
});

router.get("/test", (req, res) => {
	fetch(
		`https://fluffyscratch.hampton.pw/auth/verify/v1/${req.query.username}/${req.query.publicCode}/${req.query.privateCode}/${req.query.redirectLocation}`
	)
		.then((response) => response.json())
		.then((data) => {
			res.send("Authentication result was: " + data);
		});
});

router.get(
	"/verify/v1/:username/:publicCode/:privateCode/:redirectLocation",
	(req, res) => {

		req.params.redirectLocation = Buffer.from(
			req.params.redirectLocation,
			"base64"
		).toString("utf-8");

		// Return false if there is nothing saved about the user on Auth
		if (!empheralData.auth[req.params.username]) {
			res.json(false);
			return;
		}

		if (
			JSON.stringify(req.params) !=
			JSON.stringify(empheralData.auth[req.params.username])
		) {
			res.json(false);
			return;
		}

		// We are done with the empheralData Auth so delete it
		delete empheralData.auth[req.params.username];

		// Make a Queue item for CloudDataVerification
		queue
			.add(
				queue.TYPES.CloudDataVerification,
				{
					username: req.params.username,
					publicCode: req.params.publicCode,
					res: res,
				},
				queue.queues.asap
			)
			.then((data) => {
				for (let cloudItem of data) {
					if (
						cloudItem.user == req.params.username &&
						cloudItem.value == req.params.publicCode
					) {
						res.json(true);
						return;
					}
				}
				res.json(false);
			});
	}
);

router.get("/getKeys/v1/:username", (req, res) => {
	if (!isValidName(req.params.username)){
		res.json({error: "The username supplied is not a valid scratch username"})
		return;
	}
	if (!req.query.redirect) {
		req.query.redirect = "Zmx1ZmZ5c2NyYXRjaC5oYW1wdG9uLnB3L2F1dGgvbm9SZWY"; // If no redirect send them to fluffyscratch.hampton.pw/auth/noRef
	}

	const pageData = {
		username: req.params.username,
		publicCode: Math.round(Math.random() * 100000).toString(), // Turns Math.random into a relativly small number
		privateCode: (Math.random() * 100000000000000000).toString(), // Magic number that makes a Math.random an Integer
		redirectLocation: Buffer.from(req.query.redirect, "base64").toString(
			"utf-8"
		),
	};

	fs.readFile("./pages/auth.html", "utf8", function (err, authPageHTML) {
		if (err) throw err;
		for (let item in pageData) {
			authPageHTML = authPageHTML.replace(
				new RegExp(`{{${item}}}`, "g"),
				pageData[item]
			);
		}

		authPageHTML = authPageHTML.replace(
			new RegExp(`{{redirectLocationB64}}`, "g"),
			req.query.redirect
		);

		empheralData.auth[pageData.username] = pageData;
		res.send(authPageHTML);
	});
});

export default router;
