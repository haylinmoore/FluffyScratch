import { Comment } from "./db.mjs";
import { performance } from 'perf_hooks';

export default function getProfileCommentStats(profile) {
    return new Promise((resolve, reject) => {
        let comments = Comment.findAll({
            where: {
                profile: profile,
            },
        });

        Promise.all([comments])
            .then(([comments]) => {
                let start = performance.now();
                let stats = {
                    oldestComment: new Date().valueOf(),
                    milisecondsPerComment: 0,
                    commentCount: 0,
                    threads: {},
                    commentors: {},
                };

                for (let comment of comments) {
                    stats.commentCount++;

                    if (stats.commentors.hasOwnProperty(comment.username)) {
                        stats.commentors[comment.username] += 1;
                    } else {
                        stats.commentors[comment.username] = 1;
                    }

                    if (
                        stats.threads.hasOwnProperty(comment.parentID) &&
                        comment.parentID > -1
                    ) {
                        stats.threads[comment.parentID] += 1;
                    } else {
                        stats.threads[comment.parentID] = 1;
                    }

                    if (comment.date < stats.oldestComment) {
                        stats.oldestComment = comment.date;
                    }
                }

                stats.milisecondsPerComment =
                    (new Date().valueOf() - stats.oldestComment) /
                    stats.commentCount;


                stats.topCommentors = Object.entries(stats.commentors).sort((a, b) => b[1] - a[1]).slice(0, 5);

                stats.topThreads = Object.entries(stats.threads).sort((a, b) => b[1] - a[1]).slice(0, 5);

                delete stats.commentors;
                delete stats.threads;

                stats.computeTime = performance.now() - start;

                resolve(stats);
            })
            .catch((err) => {
                console.log(err);
                reject(err);
            });
    });
}