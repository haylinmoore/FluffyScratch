import fetch from "node-fetch";
import {PORT} from "../../modules/consts.mjs";

export default async function authTest2(req, res) {
    fetch(
        `http://localhost:${PORT}/auth/verify/v2/${req.query.privateCode}`
    )
        .then((response) => response.json())
        .then((data) => {
            res.send("Authentication result was: " + JSON.stringify(data));
        });
}