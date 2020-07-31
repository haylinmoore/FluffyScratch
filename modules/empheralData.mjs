let empheralData = {
	queueAdditions: 0, // No point in saving in the database as it resets every 5 seconds
	// Saves the metric below to the database every minute
	inNotificationQueue: [],
	auth: Object.create(null),
};

export default empheralData;
