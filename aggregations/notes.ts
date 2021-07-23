export const lookupNotes = {
	$lookup: {
		from: 'notes',
		localField: 'notes',
		foreignField: '_id',
		as: 'notes'
	}
};

export const getNoteProjection = {
	$project: {
		trip: {
			_id: 1,
			name: 1,
			slug: 1
		}
	}
};
