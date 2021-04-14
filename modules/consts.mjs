import dotenv from "dotenv";
dotenv.config();

const QUEUE_ITEMS_PER_SECOND = 10; // Make 10 requests a second unless im testing locally
const EHHH_ITEMS_PER_SECOND = QUEUE_ITEMS_PER_SECOND - 2;
const AUTH_CLOUD_PROJECT = 514649494; // The scratch project that handles OAuth
const MINUTE = 1000 * 60;
const EMPHERAL_DATA_SAVE = MINUTE; // Save Empheral data every 60s
const ONLINE_CUTOFF_TIME = MINUTE * 2; // Users are online if they pinged within a two minutes
const GET_USER_IDS = MINUTE * 2;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MAX_SCAN_TIMEOUT = DAY * 120;
const SCAN_PROFILES = MINUTE / 6;
const MAX_COMMENT_PAGE = 67;
const PORT = parseInt(process.env.PORT, 10) || 3000;

export {
	QUEUE_ITEMS_PER_SECOND,
	AUTH_CLOUD_PROJECT,
	EMPHERAL_DATA_SAVE,
	ONLINE_CUTOFF_TIME,
	EHHH_ITEMS_PER_SECOND,
	GET_USER_IDS,
	MINUTE,
	SCAN_PROFILES,
	MAX_SCAN_TIMEOUT,
	MAX_COMMENT_PAGE,
	PORT
};
