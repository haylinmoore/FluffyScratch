import { User } from "./db.mjs";
import { MAX_SCAN_TIMEOUT } from "./consts.mjs";
import getProfileCommentStats from "./getProfileCommentStats.mjs";
export default function calculateNextScan(username) {
    new Promise((resolve, reject) => {
        getProfileCommentStats(username).then((stats) => {
            const date = new Date().valueOf();
            let nextScrape = date + stats.milisecondsPerComment * 20;
            let longest = date + MAX_SCAN_TIMEOUT;
            if (stats.milisecondsPerComment == null || nextScrape > longest) {
                nextScrape = longest;
            }
            return User.update(
                {
                    lastScrape: date,
                    nextScrape: nextScrape,
                    fullScanned: true,
                    scanning: 0,
                },
                {
                    where: {
                        username: username,
                    },
                }
            );
        });
    });
}