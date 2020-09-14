import {
    MAX_COMMENT_PAGE,
} from "./consts.mjs";
import collectCommentsFromProfilePage from "./collectCommentsFromProfilePage.mjs";
import saveCommentPageToDB from "./saveCommentPageToDB.mjs";
import { User } from "./db.mjs";
import calculateNextScan from "./calculateNextScan.mjs";

function scrapeWholeProfile(username, currentPage) {
    return new Promise((resolve) => {
        if (currentPage <= 0) {
            currentPage = 1;
        } else if (currentPage > MAX_COMMENT_PAGE) {
            resolve("Finished Scrape by hitting max");
            return;
        }

        User.update(
            { scanning: currentPage },
            {
                where: {
                    username: username,
                },
            }
        );

        let pageScrapes = [];
        for (let i = 0; i < 10; i++) {
            let newPage = currentPage + i;
            if (newPage > MAX_COMMENT_PAGE) {
                break;
            }
            pageScrapes.push(collectCommentsFromProfilePage(username, newPage));
        }

        Promise.all(pageScrapes).then((pageScrapes) => {
            let pageSaves = [];
            for (let page of pageScrapes) {
                if (page.length === 0) {
                    continue;
                }
                pageSaves.push(saveCommentPageToDB(page, username));
            }
            Promise.all(pageSaves)
                .then(() => {
                    if (pageSaves.length < 10) {
                        return scrapeWholeProfile(
                            username,
                            MAX_COMMENT_PAGE + 69420
                        );
                    }
                    return scrapeWholeProfile(username, currentPage + 10);
                })
                .then((message) => {
                    // We only want the rest of this running on the base
                    if (currentPage != 1) {
                        resolve();
                    }
                    return calculateNextScan(username);
                })
                .then(() => {
                    resolve();
                });
        }).catch((e) => {
            throw e;
        })
    });
}

export default scrapeWholeProfile;