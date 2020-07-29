const QUEUE_REQUEST_TIMEOUT = 100; // Wait 100ms between using the queue
const AUTH_CLOUD_PROJECT = 413751680; // The scratch project that handles OAuth
const EMPHERAL_DATA_SAVE = 1000 * 60; // Save Empheral data every 60s
const ONLINE_CUTOFF_TIME = 1000 * 60 * 1; // Users are online if they pinged within a minute

export {
	QUEUE_REQUEST_TIMEOUT,
	AUTH_CLOUD_PROJECT,
	EMPHERAL_DATA_SAVE,
	ONLINE_CUTOFF_TIME,
};
