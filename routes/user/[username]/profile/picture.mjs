/*
    Path: /user/[username]/profile/picture
    Purpose: Returns the profile picture for the user

*/

import getUserID from "../../../../modules/getUserID.mjs";

export default async function userUsernameProfilePicture(req, res) {
    const id = await getUserID(req.params.username);
    res.redirect(
        302,
        `https://cdn2.scratch.mit.edu/get_image/user/${id}_60x60.png`
    );
}
