import isValidName from "../../../modules/isValidName.mjs";
import fs from "fs";
import {Auth} from "../../../modules/db.mjs";

export default async function authGetKeysv2(req, res) {
    let url;
    try {
        url=new URL("https://"+Buffer.from(req.query.redirect||"Zmx1ZmZ5c2NyYXRjaC5oYW1wdG9uLnB3L2F1dGgvbm9SZW", "base64").toString("utf-8"))
    } catch(e) {}
    if (!url) {
        url=new URL("https://fluffyscratch.hampton.pw/auth/noRef")
    }

    const pageData = {
        publicCode: Math.round(Math.random() * 100000).toString(), // Turns Math.random into a relativly small number
        privateCode: (Math.random() * 100000000000000000).toString(), // Magic number that makes a Math.random an Integer
        redirectLocation: Buffer.from(req.query.redirect, "base64").toString(
            "utf-8"
        )
    };
    
    url.searchParams.set("privateCode", privateCode)
    pageData.nextURL=JSON.stringify(url.href);

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
