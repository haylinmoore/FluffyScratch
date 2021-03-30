import Sequelize from "sequelize";
const Op = Sequelize.Op;
import fetch from "node-fetch";
import dotenv from "dotenv";
import { GET_USER_IDS } from "./consts.mjs";
import queue from "./queue.mjs";
import isValidName from "../modules/isValidName.mjs";

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_DATABASE || "fluffyscratch",
    process.env.DB_USERNAME || "root",
    process.env.DB_PASSWORD || "localtesting",
    {
        host: process.env.DB_HOST || "localhost",
        dialect: process.env.DB_CONNECTION || "mysql",
        logging: false,
    }
);

sequelize
    .authenticate()
    .then(() => {
        console.log("Connection has been established successfully.");
    })
    .catch((err) => {
        console.error("Unable to connect to the database:", err);
    });

const User = sequelize.define("user", {
    username: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    id: {
        type: Sequelize.INTEGER,
        defaultValue: -1,
    },
    lastKeepAlive: {
        type: Sequelize.BIGINT,
        defaultValue: -1,
    },
    messages: {
        type: Sequelize.INTEGER,
        defaultValue: -1,
    },
    lastScrape: {
        type: Sequelize.BIGINT,
        defaultValue: -1,
    },
    nextScrape: {
        type: Sequelize.BIGINT,
        defaultValue: -1,
    },
    scanning: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    fullScanned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
});

User.sync({ force: false, alter: true })
    .then(() => {
        User.update(
            {
                scanning: 0,
            },
            {
                where: {
                    scanning: { [Op.not]: 0 },
                },
            }
        );
    })
    .catch((err) => {
        console.error(err);
    });

const Analytic = sequelize.define("analytic", {
    name: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

Analytic.sync({ force: false, alter: true })
    .then(() => {
        Analytic.findOrCreate({
            where: { name: "totalRequests" },
            defaults: {},
        });
        Analytic.findOrCreate({
            where: { name: "requestsToScratch" },
            defaults: {},
        });
    })
    .catch((err) => {
        console.error(err);
    });

/* 
"username": "Chiroyce",
        "usernameID": "58524660",
        "commentID": "86697819",
        "date": 1596294692000,
        "text": "@_RareScratch2_ He doesn’t do F4F.",
		"parent": "86697361"
		*/

const Comment = sequelize.define("comment", {
    username: {
        type: Sequelize.STRING,
    },
    commentID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
    },
    date: {
        type: Sequelize.BIGINT,
    },
    text: {
        type: Sequelize.STRING(2048),
    },
    parentID: {
        type: Sequelize.INTEGER,
    },
    profile: {
        type: Sequelize.STRING,
    },
}, {
    indexes: [{ name: 'parentID', fields: ['parentID'] }, { name: 'username', fields: ['username'] }, { name: 'profile', fields: ['profile'] }]
});

Comment.sync({ force: false, alter: true })
    .then(() => { })
    .catch((err) => {
        console.error(err);
    });


const Auth = sequelize.define("auth", {
    publicCode: {
        type: Sequelize.INTEGER,
    },
    privateCode: {
        type: Sequelize.BIGINT,
        primaryKey: true,
    },
    redirectLocation: {
        type: Sequelize.STRING(2048),
    }
});

Auth.sync({ force: false, alter: true })
    .then(() => { })
    .catch((err) => {
        console.error(err);
    });

function syncIDs() {
    User.findAll({ where: { id: -1 } }).then((users) => {
        users.forEach((user) => {

            if (!isValidName(user.get("username"))) {
                user.destroy();
                console.log("Destroyed an invalid user because of Apple");
                return;
            }


        });
    });
}

function cleanupAuth(){
    Auth.destroy({
        where: {
            updatedAt: {
                [Op.lt]: new Date(new Date().getTime() - (5 * 60000)),
            },
        }
    })
}

setInterval(cleanupAuth, 1000 * 60);
setInterval(syncIDs, GET_USER_IDS);
setTimeout(syncIDs, 1000);

export { User, Analytic, Comment, Auth };
