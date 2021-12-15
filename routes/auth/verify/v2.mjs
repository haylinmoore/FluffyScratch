import {Auth} from "../../../modules/db.mjs";
import queue from "../../../modules/queue.mjs";

export default async function authVerifyV2(req, res) {

    let response = {
        valid: false,
        username: null,
        redirect: null
    }
    const auth = await Auth.findOne({where: {privateCode: req.params.privateCode}})

    if (auth == null){
        res.json(response);
        return;
    }

    Auth.destroy({where: {privateCode: req.params.privateCode}})

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
                    cloudItem.value == auth.publicCode && cloudItem.user != "46009361"
                ) {
                    response = {
                        valid: true,
                        username: cloudItem.user,
                        redirect: auth.redirectLocation
                    }
                    res.json(response);
                    return;
                }
            }
            res.json(response);
        })

};
