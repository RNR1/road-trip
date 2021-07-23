export const lookupEvents = {
	$lookup: {
		from: 'scheduledEvents',
		localField: 'events',
		foreignField: '_id',
		as: 'events'
	}
};

export const getTripScheduleProjection = {
	$project: {
		_id: 1,
		events: {
			_id: 1,
			title: 1,
			location: 1,
			startDate: 1,
			endDate: 1
		},
		trip: {
			_id: 1,
			name: 1
		}
	}
};
