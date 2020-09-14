import getProfileCommentStats from "../../../../../modules/getProfileCommentStats.mjs";

export default async function userUsernameProfileCommentsStats(req, res) {
    res.json(await getProfileCommentStats(req.params.username));
}