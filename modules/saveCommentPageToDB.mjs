import commentObjectToCommentDBObject from "./commentObjectToCommentDBObject.mjs";
import { Comment } from "./db.mjs";
export default async function saveCommentPageToDB(page, profile) {
    let comments = [];

    for (let thread of page) {
        comments.push(commentObjectToCommentDBObject(thread, profile));
        for (let child of thread.replies) {
            comments.push(commentObjectToCommentDBObject(child, profile));
        }
    }

    if (comments.length == 0) {
        return 1;
    }

    await Comment.bulkCreate(comments, {
        updateOnDuplicate: ["text", "parentID"],
    });

    return 1;
}