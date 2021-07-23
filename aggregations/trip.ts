export const lookupTrip = [
	{
		$lookup: {
			from: 'trips',
			localField: 'trip',
			foreignField: '_id',
			as: 'trip'
		}
	},
	{ $unwind: '$trip' }
];

export function lookupUsers(as: 'invitees' | 'participants') {
	return {
		$lookup: {
			from: 'users',
			localField: as,
			foreignField: '_id',
			as
		}
	};
}

export const getTripProjection = {
	$project: {
		participants: {
			password: 0,
			email: 0,
			createdAt: 0
		},
		notes: {
			trip: 0,
			createdAt: 0
		}
	}
};

export const inviteProjection = {
	$project: {
		participants: {
			password: 0,
			email: 0
		}
	}
};
