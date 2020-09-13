/*
    Path: /user/[username]/test
    Purpose: Returns a greeting to the user based on the supplied username

*/
export default function userUsernameTest(req, res) {
    res.json({ msg: "Hello " + req.params.username });
}
