export default function convertCommentToJSON(comment, head) {
    let obj = {
        username: comment.find("div.name").text().trim(),
        usernameID: comment
            .find("img.avatar")
            .attr("src")
            .split("user/")[1]
            .split("_")[0],
        commentID: comment.attr("data-comment-id"),
        date: new Date(comment.find("span.time").attr("title")).valueOf(),
        text: comment
            .find("div.content")
            .text()
            .trim()
            .replaceAll("\n      \n      \n       ", "")
            .substring(0, 1024),
    };

    if (head) {
        obj.replies = [];
    } else {
        obj.parent = comment.find("a.reply").attr("data-parent-thread");
    }

    return obj;
};