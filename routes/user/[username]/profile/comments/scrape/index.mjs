import { User } from "../../../../../../modules/db.mjs";
import scrapeWholeProfile from "../../../../../../modules/scrapeWholeProfile.mjs";

export default async function userUsernameScrape(req, res) {
    const username = req.params.username;
    let [user, created] = await User.findOrCreate({
        where: { username: username },
        defaults: {
            username: username,
        },
    });

    if (user.nextScrape < new Date().valueOf() && user.scanning === 0) {
        res.json({
            msg: `${username} is being scraped`,
            status: `started`
        });
        await scrapeWholeProfile(username, 1);
    } else if (user.scanning > 0) {
        res.json({ msg: `${username}'s profile comments are currently being scanned and is on pages ${user.scanning}-${user.scanning + 10}`, page: user.scanning, status: "scanning" })
    } else {
        res.json({
            msg: `${username} was already scraped on ${new Date(
                user.lastScrape
            )}, next scrape is at ${new Date(user.nextScrape)}`,
            nextScrape: user.nextScrape,
            lastScrape: user.lastScrape,
            status: 'done'
        });
    }


}