import dotenv from "dotenv";
dotenv.config();

const QUEUE_ITEMS_PER_SECOND = process.env.DEPLOYED ? 10 : 10; // Make 10 requests a second unless im testing locally
const EHHH_ITEMS_PER_SECOND = QUEUE_ITEMS_PER_SECOND - 2;
const AUTH_CLOUD_PROJECT = 413751680; // The scratch project that handles OAuth
const MINUTE = 1000 * 60;
const EMPHERAL_DATA_SAVE = MINUTE; // Save Empheral data every 60s
const ONLINE_CUTOFF_TIME = MINUTE * 2; // Users are online if they pinged within a two minutes
const GET_USER_IDS = MINUTE * 2;
const SCAN_PROFILES = MINUTE / 4;

export {
	QUEUE_ITEMS_PER_SECOND,
	AUTH_CLOUD_PROJECT,
	EMPHERAL_DATA_SAVE,
	ONLINE_CUTOFF_TIME,
	EHHH_ITEMS_PER_SECOND,
	GET_USER_IDS,
	MINUTE,
	SCAN_PROFILES,
};
