const QUEUE_ITEMS_PER_SECOND = 10; // Make 10 requests a second
const EHHH_ITEMS_PER_SECOND = 8;
const AUTH_CLOUD_PROJECT = 413751680; // The scratch project that handles OAuth
const EMPHERAL_DATA_SAVE = 1000 * 60; // Save Empheral data every 60s
const ONLINE_CUTOFF_TIME = 1000 * 60 * 1; // Users are online if they pinged within a minute

export {
	QUEUE_ITEMS_PER_SECOND,
	AUTH_CLOUD_PROJECT,
	EMPHERAL_DATA_SAVE,
	ONLINE_CUTOFF_TIME,
	EHHH_ITEMS_PER_SECOND,
};
