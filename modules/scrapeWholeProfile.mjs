import {
    MAX_COMMENT_PAGE,
} from "./consts.mjs";
import collectCommentsFromProfilePage from "./collectCommentsFromProfilePage.mjs";
import saveCommentPageToDB from "./saveCommentPageToDB.mjs";
import { User } from "./db.mjs";
import calculateNextScan from "./calculateNextScan.mjs";

async function scrapeWholeProfile(username, currentPage) {
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

    let pageScrapesR = await Promise.all(pageScrapes)

    let pageSaves = [];
    for (let page of pageScrapesR) {
        if (page.length === 0) {
            continue;
        }
        pageSaves.push(saveCommentPageToDB(page, username));
    }
    let pageSavesR = await Promise.all(pageSaves);
    if (pageSavesR.length === 10) {
        await scrapeWholeProfile(username, currentPage + 10);
    }

    // We only want the rest of this running on the base
    if (currentPage != 1) {
        return;
    }
    await calculateNextScan(username);
    return;
}

export default scrapeWholeProfile;