import { User } from "../../../../../../modules/db.mjs";
import scrapeWholeProfile from "../../../../../../modules/scrapeWholeProfile.mjs";

export default async function userUsernameScrape(req, res) {
    const username = req.params.username;
    User.findOrCreate({
        where: { username: username },
        defaults: {
            username: username,
        },
    }).then(([user, created]) => {
        if (user.nextScrape < new Date().valueOf()) {
            res.json({
                msg: `${username} is being scraped, you can see the progress at the link below`,
                link: `/profilecomments/scrapeuser/v1/${username}/status`,
            });
            scrapeWholeProfile(username, 1).catch((e) => {
                throw e;
            })
        } else {
            res.json({
                msg: `${username} was already scraped on ${new Date(
                    user.lastScrape
                )}, next scrape is at ${new Date(user.nextScrape)}`,
                nextScrape: user.nextScrape,
                lastScrape: user.lastScrape,
            });
        }
    }).catch((err) => {
        console.log(err);
    });

}