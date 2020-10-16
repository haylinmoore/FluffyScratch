import empheralData from "../../../modules/empheralData.mjs";
import queue from "../../../modules/queue.mjs";

export default async function authVerifyV1(req, res) {
    req.params.username = req.params.username.toLowerCase();

    req.params.redirectLocation = Buffer.from(
        req.params.redirectLocation,
        "base64"
    ).toString("utf-8");

// Return false if there is nothing saved about the user on Auth
    if (!empheralData.auth[req.params.username]) {
        res.json(false);
        return;
    }

    if (
        JSON.stringify(req.params) !=
        JSON.stringify(empheralData.auth[req.params.username])
    ) {
        res.json(false);
        return;
    }

// We are done with the empheralData Auth so delete it
    delete empheralData.auth[req.params.username];

// Make a Queue item for CloudDataVerification
    queue
        .add(
            queue.TYPES.CloudDataVerification,
            {
                username: req.params.username,
                publicCode: req.params.publicCode,
                res: res,
            },
            queue.queues.asap
        )
        .then((data) => {
            for (let cloudItem of data) {
                if (
                    cloudItem.user.toLowerCase() == req.params.username.toLowerCase() &&
                    cloudItem.value == req.params.publicCode
                ) {
                    res.json(true);
                    return;
                }
            }
            res.json(false);
        })

};