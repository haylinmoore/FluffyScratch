import isValidName from "../../../../modules/isValidName.mjs";
import fs from "fs";
import empheralData from "../../../../modules/empheralData.mjs";

export default async function authGetKeysv1Username(req, res) {
    if (!isValidName(req.params.username)) {
        res.json({ error: "The username supplied is not a valid scratch username" })
        return;
    }

    if (!req.query.redirect) {
        req.query.redirect = "Zmx1ZmZ5c2NyYXRjaC5oYW1wdG9uLnB3L2F1dGgvbm9SZWY"; // If no redirect send them to fluffyscratch.hampton.pw/auth/noRef
    }

    const pageData = {
        username: req.params.username.toLowerCase(),
        publicCode: Math.round(Math.random() * 100000).toString(), // Turns Math.random into a relativly small number
        privateCode: (Math.random() * 100000000000000000).toString(), // Magic number that makes a Math.random an Integer
        redirectLocation: Buffer.from(req.query.redirect, "base64").toString(
            "utf-8"
        ),
    };

    fs.readFile("./pages/auth.html", "utf8", function (err, authPageHTML) {
        if (err) throw err;
        for (let item in pageData) {
            authPageHTML = authPageHTML.replace(
                new RegExp(`{{${item}}}`, "g"),
                pageData[item]
            );
        }

        authPageHTML = authPageHTML.replace(
            new RegExp(`{{redirectLocationB64}}`, "g"),
            req.query.redirect
        );

        empheralData.auth[pageData.username] = pageData;
        res.send(authPageHTML);
    });
};