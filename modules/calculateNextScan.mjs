import { User } from "./db.mjs";
import { MAX_SCAN_TIMEOUT } from "./consts.mjs";
import getProfileCommentStats from "./getProfileCommentStats.mjs";
export default async function calculateNextScan(username) {
    const stats = await getProfileCommentStats(username);
    const date = new Date().valueOf();
    let nextScrape = date + stats.milisecondsPerComment * 20;
    let longest = date + MAX_SCAN_TIMEOUT;
    if (stats.milisecondsPerComment == null || nextScrape > longest || isNaN(nextScrape)) {
        nextScrape = longest;
    }
    await User.update(
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

    return;
}