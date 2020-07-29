import express from "express";
import empheralData from "./modules/empheralData.mjs";

// Setups
const app = express();
const port = 3000;

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	next();
	if (req.originalUrl != "/metrics") {
		empheralData.totalRequests++;
	}
});

app.use("/static", express.static("static"));

app.get("/", (req, res) =>
	res.send("If you do not know what this is you should not be here <3")
);

import notifications from "./routes/notifications.mjs";
app.use("/notifications", notifications);

import auth from "./routes/auth.mjs";
app.use("/auth", auth);

import profilepicture from "./routes/profilepicture.mjs";
app.use("/profilepicture", profilepicture);

import profilecomments from "./routes/profilecomments.mjs";
app.use("/profilecomments", profilecomments);

import metrics from "./routes/metrics.mjs";
app.use("/metrics", metrics);

app.listen(port, () =>
	console.log(`Example app listening at http://localhost:${port}`)
);

// Go brrrr
