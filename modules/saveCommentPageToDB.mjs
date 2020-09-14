import commentObjectToCommentDBObject from "./commentObjectToCommentDBObject.mjs";
import { Comment } from "./db.mjs";
export default function saveCommentPageToDB(page, profile) {
    return new Promise((resolve, reject) => {
        let comments = [];

        for (let thread of page) {
            comments.push(commentObjectToCommentDBObject(thread, profile));
            for (let child of thread.replies) {
                comments.push(commentObjectToCommentDBObject(child, profile));
            }
        }

        if (comments.length == 0) {
            resolve();
            return;
        }

        Comment.bulkCreate(comments, {
            updateOnDuplicate: ["text", "parentID"],
        })
            .then(() => {
                resolve();
            })
            .catch((err) => {
                console.log(comments);
                console.log(err);
                resolve();
            });
    });
}