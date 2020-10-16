import fetch from "node-fetch";
import {PORT} from "../../modules/consts.mjs";

export default async function authTest(req, res) {
    fetch(
        `http://localhost:${PORT}/auth/verify/v1/${req.query.username}/${req.query.publicCode}/${req.query.privateCode}/${req.query.redirectLocation}`
    )
        .then((response) => response.json())
        .then((data) => {
            res.send("Authentication result was: " + data);
        });
}