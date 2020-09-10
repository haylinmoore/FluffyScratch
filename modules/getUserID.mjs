import { User } from "../modules/db.mjs";
import fetch from "node-fetch";
import queue from "./queue.mjs"

export default function getUserID(username) {
    return new Promise((resolve, reject) => {

        // First lets see if we have the userID in our database
        User.findOrCreate({
            where: { username: username },
            defaults: { username: username },
        }).then(([user, created]) => {
            // If we have it on file lets resolve the promise
            if (user.id > -1) {
                resolve(user.id);
            }

            fetch(
                `https://scratchdb.lefty.one/v2/user/info/${username}`
            )
                .then((response) => response.json())
                .then((data) => {
                    // lets see if Lefty had it, if it not or if it is null
                    if (data.error === "notfound" || data.id == null) {
                        queue
                            .add(
                                queue.TYPES.GetUserProfile,
                                {
                                    username: user.get("username"),
                                },
                                queue.queues.asap
                            )
                            .then((profile) => {
                                if (profile.code === "NotFound") {
                                    user.destroy();
                                    reject();
                                } else {
                                    user.set("id", profile.id);
                                    user.save();
                                    resolve(profile.id);
                                }
                            });
                    } else {
                        user.set("id", data.id);
                        user.save();
                        resolve(data.id);
                    }
                })
        });
    })
}