import queue from "./queue.mjs";
import cheerio from "cheerio";
import convertCommentToJSON from "./convertCommentToJSON.mjs";

export default function collectCommentsFromProfilePage(username, page) {
    return new Promise((resolve) => {
        queue
            .add(
                queue.TYPES.ProfileCommentCollector,
                {
                    username: username,
                    page: page,
                },
                queue.queues.asap
            )
            .then((html) => {
                const $ = cheerio.load(html);
                let comments = [];

                $("li.top-level-reply").each(function (index) {
                    let elm = $(this);
                    let headComment = convertCommentToJSON(
                        elm.find("div.comment").first(),
                        true
                    );

                    elm.find("ul.replies")
                        .find("div.comment")
                        .each((index, comment) => {
                            headComment.replies.push(
                                convertCommentToJSON($(comment), false)
                            );
                        });

                    comments.push(headComment);
                });

                resolve(comments);
            });
    });
};