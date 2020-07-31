const QUEUE_ITEMS_PER_SECOND = 10; // Make 10 requests a second
const EHHH_ITEMS_PER_SECOND = 8;
const AUTH_CLOUD_PROJECT = 413751680; // The scratch project that handles OAuth
const MINUTE = 1000 * 60;
const EMPHERAL_DATA_SAVE = MINUTE; // Save Empheral data every 60s
const ONLINE_CUTOFF_TIME = MINUTE; // Users are online if they pinged within a minute
const GET_USER_IDS = MINUTE * 2;

export {
	QUEUE_ITEMS_PER_SECOND,
	AUTH_CLOUD_PROJECT,
	EMPHERAL_DATA_SAVE,
	ONLINE_CUTOFF_TIME,
	EHHH_ITEMS_PER_SECOND,
	GET_USER_IDS,
	MINUTE,
};
