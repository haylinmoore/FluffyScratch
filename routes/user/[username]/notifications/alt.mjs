/*
    Path: /user/[username]/notifications/alt
    Purpose: Returns the current notification count for a user but place the user is the lowest queue

*/

import handleNotificationRequest from "./handleNotificationRequest.mjs";
import queue from "../../../../modules/queue.mjs";

export default function userUsernameNotificationsAlt(req, res) {
    handleNotificationRequest(res, req.params.username, queue.queues.idrc);
}