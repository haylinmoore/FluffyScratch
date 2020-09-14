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

            collectCommentsFromProfile(username, 1)
                .then((comments) => {
                    return saveCommentPageToDB(comments, username);
                })
                .then(() => {
                    return collectCommentsFromProfile(username, 2);
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

if (process.env.DEPLOYED === "hubble") {
    setInterval(scanProfiles, SCAN_PROFILES);
}