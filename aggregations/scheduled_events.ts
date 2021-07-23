export const lookupTripSchedule = [
	{
		$lookup: {
			from: 'tripSchedules',
			localField: 'schedule',
			foreignField: '_id',
			as: 'schedule'
		}
	},
	{ $unwind: '$schedule' },
	{
		$lookup: {
			from: 'trips',
			localField: 'schedule.trip',
			foreignField: '_id',
			as: 'trip'
		}
	},
	{ $unwind: '$trip' }
];

export const getScheduledEventProjection = {
	$project: {
		_id: 1,
		title: 1,
		location: 1,
		startDate: 1,
		endDate: 1,
		schedule: {
			_id: 1
		},
		trip: {
			_id: 1,
			name: 1
		}
	}
};
