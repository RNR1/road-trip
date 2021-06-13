import { uploadImage } from 'cloudinary';
import { format } from 'datetime';
import { Bson } from 'mongo';
import type { TokenRequest } from 'middleware';
import { trips } from 'models';
import { Response, NextFunction } from 'opine';
import { slugify } from 'slugify';
import type { Trip } from 'models';
import type { UploadAPIResponse } from 'types/cloudinary';

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

export const getTrip = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { slug } = req.params;
		const result = await trips()
			?.aggregate([
				{
					$match: {
						slug,
						participants: {
							$elemMatch: { $eq: new Bson.ObjectID(req.user?.id) }
						}
					}
				},
				{
					$lookup: {
						from: 'users',
						localField: 'participants',
						foreignField: '_id',
						as: 'participants'
					}
				},
				{
					$project: {
						participants: {
							password: 0,
							email: 0
						}
					}
				}
			])
			.next();
		if (!result) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip.");
		}
		res.json(result);
		next();
	} catch (error) {
		if (error.message.includes('a Buffer or string of 12 bytes'))
			error.message = "We couldn't find your trip.";
		next(error);
	}
};

export const addTrip = async (
	req: TokenRequest,
	res: Response<{ message: string; id: string; slug: string }>,
	next: NextFunction
) => {
	try {
		const { name, description, image } = req.body as Partial<Trip>;
		if (!name || typeof name !== 'string') {
			res.setStatus(403);
			throw new Error('Trip name is missing.');
		}

		let asset: UploadAPIResponse | null = null;
		if (Boolean(image?.src) && typeof image?.src === 'string') {
			asset = await uploadImage(image.src, 'c_thumb,g_center,w_200,h_200');
			if (asset?.error) throw new Error('We had a problem with your image');
		}

		const slug = slugify(`${name} ${format(new Date(), 'MM-dd-yy-hh-mm-ss')}`, {
			replacement: '-',
			lower: true
		});

		const tripId = await trips()?.insertOne({
			name,
			slug,
			description,
			image: asset?.error
				? undefined
				: { src: asset?.eager[0]?.url, alt: image?.alt },
			participants: [new Bson.ObjectID(req.user?.id)],
			notes: [],
			track: []
		});
		if (!tripId) {
			res.setStatus(500);
			throw new Error(
				"Yikes, something here doesn't look right, please try again"
			);
		}
		res.setStatus(201).json({
			message: 'Trip has been created Successfully!',
			id: tripId.toString(),
			slug
		});
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
