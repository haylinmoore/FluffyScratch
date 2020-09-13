import express from "express";
import empheralData from "./modules/empheralData.mjs";
import { Analytic } from "./modules/db.mjs";
import readLastLines from "read-last-lines";

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";

const startTime = new Date();

console.log(`Server started at ${startTime}`);

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
        DEPLOYED: process.env.DEPLOYED,
        startTime,
    });
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

import notifications from "./routes/notifications.mjs";
app.use("/notifications", notifications);

import auth from "./routes/auth.mjs";
app.use("/auth", auth);


import profilecomments from "./routes/profilecomments.mjs";
app.use("/profilecomments", profilecomments);

import metrics from "./routes/metrics.mjs";
app.use("/metrics", metrics);

import userUsernameTest from "./routes/user/[username]/test.mjs";
app.use("/user/:username/test", userUsernameTest);

// Profile picture APIs
import userUsernameProfilePicture from "./routes/user/[username]/profile/picture.mjs";
app.use("/user/:username/profile/picture/", userUsernameProfilePicture);
app.use("/profilepicture/v1/:username", userUsernameProfilePicture); // Temporary for backwards compatibility

app.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
);
// Go brrrr
