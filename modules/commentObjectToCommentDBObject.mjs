export default function commentObjectToCommentDBObject(comment, profile) {
    let parentID = -1;
    if (comment.replies) {
        if (comment.replies.length > 0) {
            parentID = comment.commentID;
        }
    } else if (comment.parent) {
        parentID = comment.parent;
    }
    return {
        username: comment.username,
        date: comment.date,
        text: comment.text,
        parentID: parentID,
        profile: profile,
        commentID: comment.commentID,
    };
}
