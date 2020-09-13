/*
    Path: /user/[username]/notifications
    Purpose: Returns the current notification count for a user

*/

import handleNotificationRequest from "./handleNotificationRequest.mjs";
import queue from "../../../../modules/queue.mjs";

export default function userUsernameNotifications(req, res) {
    handleNotificationRequest(res, req.params.username, queue.queues.ehhh);
}