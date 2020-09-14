import Sequelize from "sequelize";
const Op = Sequelize.Op;
import {
    SCAN_PROFILES,
} from "./modules/consts.mjs";
import { User } from "./modules/db.mjs";
import saveCommentPageToDB from "./modules/saveCommentPageToDB.mjs";
import scrapeWholeProfile from "./modules/scrapeWholeProfile.mjs";
import collectCommentsFromProfilePage from "./modules/collectCommentsFromProfilePage.mjs";
import calculateNextScan from "./modules/calculateNextScan.mjs";

function scanProfiles() {
    User.findOne({
        where: {
            nextScrape: { [Op.lt]: new Date().valueOf() },
            id: { [Op.gt]: -1 },
            scanning: 0,
        },
        order: [Sequelize.literal("createdAt ASC")],
    }).then((user) => {
        if (user === null) {
            return;
        }

        let username = user.get("username");
        console.log("Started Scan of " + username + " at " + new Date());

        user.set("scanning", 1);
        user.save();
        if (user.get("fullScanned") == false) {
            scrapeWholeProfile(username, 1);
        } else {
            let pages = [];

            collectCommentsFromProfilePage(username, 1)
                .then((comments) => {
                    return saveCommentPageToDB(comments, username);
                })
                .then(() => {
                    return collectCommentsFromProfilePage(username, 2);
                })
                .then((comments) => {
                    return saveCommentPageToDB(comments, username);
                })
                .then(() => {
                    calculateNextScan(username);
                });
        }
    });
}

let scanInterval;

if (process.env.DEPLOYED === "hubble" || true) {
    scanInterval = setInterval(scanProfiles, SCAN_PROFILES);
}

export { scanInterval };