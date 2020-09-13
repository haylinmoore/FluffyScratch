import Sequelize from "sequelize";
const Op = Sequelize.Op;
import { Comment } from "../../../../modules/db.mjs";

export default async function commentsFindByParentID(req, res) {
    res.json(await Comment.findAll({
        where: {
            parentID: req.params.parentID,
        },
    }));
} 
