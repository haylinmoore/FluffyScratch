import isValidName from "../../../modules/isValidName.mjs";
import fs from "fs";
import crypto from "crypto";
import { Auth } from "../../../modules/db.mjs";
import { url } from "inspector";

const randomKey = async (length) => {
    const buffer = await crypto.randomBytes(length);
    return buffer
};

export default async function authGetKeysv2(req, res) {
    if (!req.query.redirect) {
        req.query.redirect = "Zmx1ZmZ5c2NyYXRjaC5oYW1wdG9uLnB3L2F1dGgvbm9SZWY"; // If no redirect send them to fluffyscratch.hampton.pw/auth/noRef
    }
    let rawurl = Buffer.from(req.query.redirect, "base64").toString(
        "utf-8"
    )
    let url = new URL("https://" + rawurl)

    let publicCodeBits = await randomKey(6)
    let publicCode = 0;
    for (let i = 0; i < 6; i++) {
        publicCode |= publicCodeBits[i] << (i * 8)
    }

    publicCode = Math.abs(publicCode)

    const pageData = {
        publicCode: publicCode.toString(),
        privateCode: (await randomKey(48)).toString('hex'),
        redirectLocation: rawurl
    };

    url.searchParams.set("privateCode", pageData.privateCode)
    pageData.nextURL = JSON.stringify(url.href);

    fs.readFile("./pages/auth2.html", "utf8", function (err, authPageHTML) {
        if (err) throw err;
        for (let item in pageData) {
            authPageHTML = authPageHTML.replace(
                new RegExp(`{{${item}}}`, "g"),
                pageData[item]
            );
        }

        Auth.create(pageData);

        res.send(authPageHTML);
    });
};
