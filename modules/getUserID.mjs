import { User } from "../modules/db.mjs";
import fetch from "node-fetch";
import queue from "./queue.mjs";

export default function getUserID(username) {
    return new Promise(async (resolve, reject) => {
        // First lets see if we have the userID in our database
        let [user, created] = await User.findOrCreate({
            where: { username: username },
            defaults: { username: username },
        });

        // If we have it on file lets resolve the promise
        if (user.id > -1) {
            resolve(user.id);
        }

        try {
            let leftyResponse = await fetch(
                `https://scratchdb.lefty.one/v2/user/info/${username}`
            );

            let leftyData = await leftyResponse.json();

            if (leftyData.error === "notfound" || leftyData.id == null) {
                jumpToTheCatchStatement()
            }

            user.set("id", data.id);
            user.save();
            resolve(data.id);
        } catch (err) {
            let profile = await queue.add(
                queue.TYPES.GetUserProfile,
                {
                    username: user.get("username"),
                },
                queue.queues.asap
            );

            if (profile.code === "NotFound") {
                user.destroy();
                resolve("default");
            } else {
                user.set("id", profile.id);
                user.save();
                resolve(profile.id);
            }
        }
    });
}
