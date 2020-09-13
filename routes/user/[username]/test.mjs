/*
    Path: /user/[username]/test
    Purpose: Returns a greeting to the user based on the supplied username

*/
export default function userUsernameTest(req, res) {
	res.send("Hello " + req.params.username);
}
