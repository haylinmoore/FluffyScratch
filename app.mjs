import express from "express";
import empheralData from "./modules/empheralData.mjs";
import { Analytic } from "./modules/db.mjs";
import readLastLines from "read-last-lines";
import next from "next";
import notifications from "./routes/notifications.mjs";
import auth from "./routes/auth.mjs";
import profilepicture from "./routes/profilepicture.mjs";
import profilecomments from "./routes/profilecomments.mjs";
import metrics from "./routes/metrics.mjs";

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const server = next({ dev });
const handle = server.getRequestHandler();

server.prepare().then(() => {
	// Setups
	const app = express();

	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
		res.header(
			"Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content-Type, Accept"
		);
		next();
		if (req.originalUrl != "/metrics") {
			Analytic.increment("value", { where: { name: "totalRequests" } });
		}
	});

	app.use("/static", express.static("static"));

	app.get("/", (req, res) =>
		res.send("If you do not know what this is you should not be here <3")
	);

	app.get("/debug", (req, res) => {
		res.json({
			DEPLOYED: process.env.DEPLOYED
		})
	});

	app.get("/commit", (req, res) => {
		readLastLines.read("./.git/logs/HEAD", 1).then((lines) =>
			res.send(`
				${lines
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;")
					.replace(/'/g, "&#039;")}`)
		);
	});

	app.use("/notifications", notifications);

	app.use("/auth", auth);

	app.use("/profilepicture", profilepicture);

	app.use("/profilecomments", profilecomments);

	app.use("/metrics", metrics);

	app.all("*", (req, res) => {
		return handle(req, res);
	});

	app.listen(port, () =>
		console.log(`Example app listening at http://localhost:${port}`)
	);
});
// Go brrrr
