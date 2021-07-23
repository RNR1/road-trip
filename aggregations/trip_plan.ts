export const lookupWaypoints = {
	$lookup: {
		from: 'waypoints',
		localField: 'waypoints',
		foreignField: '_id',
		as: 'waypoints'
	}
};

export const getTripPlanProjection = {
	$project: {
		_id: 1,
		origin: 1,
		waypoints: {
			_id: 1,
			location: 1,
			stopover: 1
		},
		destination: 1,
		maxHoursPerDay: 1,
		trip: {
			_id: 1
		}
	}
};

export const savePlanProjection = {
	$project: {
		origin: 1,
		waypoints: 1,
		destination: 1,
		maxHoursPerDay: 1
	}
};
