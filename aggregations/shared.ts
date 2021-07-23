import { objectId } from 'db';

export function byId(id: unknown) {
	return { _id: objectId(id) };
}

export function matchById(id: string) {
	return { $match: byId(id) };
}

export function matchElementById(id: unknown) {
	return { $elemMatch: { $eq: objectId(id) } };
}

export function matchByParticipant(id: unknown) {
	return {
		$match: {
			'trip.participants': matchElementById(id)
		}
	};
}
