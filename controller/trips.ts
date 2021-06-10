import { Bson } from 'mongo';
import { Response, NextFunction } from 'opine';
import { trips } from 'models';
import type { Trip } from 'models';
import type { TokenRequest } from 'middleware';

export const getTrips = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const results = await trips()
			?.find(
				{
					participants: { $elemMatch: { $eq: new Bson.ObjectID(req.user?.id) } }
				},
				{ noCursorTimeout: false }
			)
			.toArray();
		res.json(results);
		next();
	} catch (error) {
		next(error);
	}
};

export const addTrip = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { name } = req.body as Partial<Trip>;
		if (!name || typeof name !== 'string') {
			res.setStatus(403);
			throw new Error('Trip name is missing.');
		}
		const tripId = await trips()?.insertOne({
			name,
			participants: [new Bson.ObjectID(req.user?.id)],
			notes: [],
			track: []
		});
		res.json({ message: 'Trip has been created Successfully!', id: tripId });
	} catch (error) {
		next(error);
	}
};

export const removeTrip = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const trip = await trips()?.findOne(
			{ _id: new Bson.ObjectID(id) },
			{ noCursorTimeout: false }
		);

		if (!trip) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip");
		}

		const byAuthUser = (trip.participants as unknown[]).find(
			participant =>
				new Bson.ObjectID(participant).toHexString() ===
				new Bson.ObjectID(req.user?.id).toHexString()
		);
		if (!byAuthUser) {
			res.setStatus(403);
			throw new Error('a Trip can be removed only by one of its participant');
		}
		await trips()?.deleteOne({ _id: new Bson.ObjectID(id) });
		res.json({ message: 'Trip has been removed Successfully' });
	} catch (error) {
		next(error);
	}
};
