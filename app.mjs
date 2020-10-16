import express from "express";
import { Analytic } from "./modules/db.mjs";
import isValidName from "./modules/isValidName.mjs";
import {PORT} from "./modules/consts.mjs"

const port = PORT;

const startTime = new Date();

console.log(`Server started at ${startTime}`);

import { scanInterval } from "./intervals.mjs";

// Setups
const app = express();

const asyncMiddleware = function (fn) {
    return function (req, res) {
        Promise.resolve(fn(req, res))
            .catch((e) => {
                console.log(`Error on ${req.originalUrl}: ${e.toString()}`);
                res.json({ msg: "error, please send a screenshot or copy paste of this page to Hampton Moore, @herohamp on Scratch, @herohamp_ on Twitter, Email is me (at) hampton (dot) pw, or make an issue on the Github repo https://github.com/hamptonmoore/FluffyScratch/issues.", error: e.toString(), url: req.originalUrl })
            });
    };
};


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

app.get("/", (req, res) =>
    res.send("If you do not know what this is you should not be here <3")
);

app.get("/testError", asyncMiddleware(async function route(req, res) { throw "Error testing"; }))

app.get("/debug", (req, res) => {
    res.json({
        DEPLOYED: process.env.DEPLOYED,
        startTime,
    });
});

app.get("/commit", (req, res) => {
    res.sendFile('commit.txt', { root: "." });
});

/*
    /auth routes
 */

import authGetKeysv1Username from "./routes/auth/getKeys/v1/[username].mjs";
app.use("/auth/getKeys/v1/:username", asyncMiddleware(authGetKeysv1Username));

import authVerifyV1 from "./routes/auth/verify/v1.mjs";
app.use("/auth/verify/v1/:username/:publicCode/:privateCode/:redirectLocation", asyncMiddleware(authVerifyV1));

import authTest from "./routes/auth/test.mjs";
app.use("/auth/test", asyncMiddleware(authTest));

import noRef from "./routes/auth/noRef.mjs";
app.use("/auth/noRef", asyncMiddleware(noRef));

import Metrics from "./routes/metrics.mjs";
app.use("/metrics", Metrics);

/*
    /user routes
*/

app.use("/user/:username", function (req, res, next) {
    if (isValidName(req.params.username)) {
        next();
    } else {
        res.json({ error: "Username is not a valid scratch username /^[\w-]{3,20}$/" });
    }
});

import userUsernameTest from "./routes/user/[username]/test.mjs";
app.use("/user/:username/test", asyncMiddleware(userUsernameTest));

// Profile picture APIs
import userUsernameProfilePicture from "./routes/user/[username]/profile/picture.mjs";
app.use("/user/:username/profile/picture/", asyncMiddleware(userUsernameProfilePicture));
app.use("/profilepicture/v1/:username", asyncMiddleware(userUsernameProfilePicture)); // Temporary for backwards compatibility

// Notifications API
import userUsernameNotifications from "./routes/user/[username]/notifications/index.mjs";
app.use("/user/:username/notifications", asyncMiddleware(userUsernameNotifications));
app.use("/notifications/v2/:username", asyncMiddleware(userUsernameNotifications)); // Temporary for backwards compatibility 
import userUsernameNotificationsAlt from "./routes/user/[username]/notifications/alt.mjs";
app.use("/user/:username/notifications/alt", asyncMiddleware(userUsernameNotificationsAlt));
app.use("/notifications/v2/:username/alt", asyncMiddleware(userUsernameNotificationsAlt)); // Temporary for backwards compatibility

// Scrape user profile
import userUsernameProfileCommentsScrape from "./routes/user/[username]/profile/comments/scrape/index.mjs";
app.use("/user/:username/profile/comments/scrape", asyncMiddleware(userUsernameProfileCommentsScrape));
import userUsernameProfileCommentsStats from "./routes/user/[username]/profile/comments/stats.mjs";
app.use("/user/:username/profile/comments/stats", asyncMiddleware(userUsernameProfileCommentsStats));


/*
    /comments routes
*/

import commentsFindByParentID from "./routes/comments/findBy/parentID/index.mjs";
app.use("/comments/findBy/parentID/:parentID", commentsFindByParentID);

app.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
);
// Go brrrr
