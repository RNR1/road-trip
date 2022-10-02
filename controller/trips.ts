import * as Aggregation from 'aggregations';
import { encode } from 'base64';
import { uploadImage } from 'cloudinary';
import { format } from 'datetime';
import { FIND_OPTIONS, getId, objectId } from 'db';
import { inviteExistingUser, inviteNewUser, sendMail } from 'emails';
import type { TokenRequest } from 'middleware';
import { tripPlans, trips, tripSchedules, users } from 'models';
import type { Trip } from 'models';
import { Response, NextFunction } from 'opine';
import { slugify } from 'slugify';
import type { UploadAPIResponse } from 'types/cloudinary';

export const getTrips = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const results = await trips()
			?.find(
				{ participants: Aggregation.matchElementById(req.user?.id) },
				FIND_OPTIONS
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
						participants: Aggregation.matchElementById(req.user?.id)
					}
				},
				Aggregation.lookupUsers('participants'),
				Aggregation.lookupUsers('invitees'),
				Aggregation.lookupNotes,
				Aggregation.getTripProjection
			])
			.next();
		if (!result) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip.");
		}
		res.json(result);
		next();
	} catch (error) {
		if (error.message.includes('a Buffer or string of 12 bytes')) {
			res.setStatus(404);
			error.message = "We couldn't find your trip.";
		}
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
		const tripPlan = await tripPlans()?.insertOne({
			origin: '',
			waypoints: [],
			destination: ''
		});
		const schedule = await tripSchedules()?.insertOne({
			events: [],
			trip: null
		});
		const tripId = await trips()?.insertOne({
			name,
			slug,
			description,
			image:
				!asset || asset?.error
					? undefined
					: { src: asset?.eager[0]?.url, alt: image?.alt },
			participants: [objectId(req.user?.id)],
			invitees: [],
			notes: [],
			tripPlan,
			schedule
		});
		if (!tripId) {
			res.setStatus(500);
			throw new Error(
				"Yikes, something here doesn't look right, please try again"
			);
		}
		tripPlans()?.updateOne(Aggregation.byId(tripPlan), {
			$set: { trip: objectId(tripId) }
		});
		tripSchedules()?.updateOne(Aggregation.byId(schedule), {
			$set: { trip: objectId(tripId) }
		});
		res.setStatus(201).json({
			message: 'Trip has been created Successfully!',
			id: tripId.toString(),
			slug
		});
	} catch (error) {
		next(error);
	}
};

export const updateTrip = async (
	req: TokenRequest,
	res: Response<{ message: string }>,
	next: NextFunction
) => {
	try {
		const { slug } = req.params;
		const { name, description, image } = req.body as Partial<Trip>;
		const trip = await trips()?.findOne({ slug }, FIND_OPTIONS);

		if (!trip) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip");
		}

		const byAuthUser = (trip.participants as unknown[]).find(
			participant => getId(participant as unknown) === getId(req.user?.id)
		);
		if (!byAuthUser) {
			res.setStatus(403);
			throw new Error('a Trip can be updated only by one of its participant');
		}

		let asset: UploadAPIResponse | null = null;
		if (!image?.src.includes('cloudinary') && image?.src) {
			asset = await uploadImage(image?.src, 'c_thumb,g_center,w_200,h_200');
			if (asset?.error) throw new Error('We had a problem with your image');
		}

		await trips()?.updateOne(
			{ _id: trip._id },
			{
				$set: {
					name,
					description,
					image:
						asset && !asset?.error
							? { src: asset.eager[0].url, alt: image?.alt ?? trip?.image?.alt }
							: trip.image
				}
			}
		);

		res.json({ message: 'We updated your trip information' });
	} catch (error) {
		next(error);
	}
};

export const getTripInvitations = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const results = await trips()
			?.find(
				{ invitees: Aggregation.matchElementById(req.user?.id) },
				FIND_OPTIONS
			)
			.toArray();
		if (!results) {
			res.setStatus(404);
			throw new Error("We couldn't find your trips.");
		}
		res.json(results);
		next();
	} catch (error) {
		if (error.message.includes('a Buffer or string of 12 bytes')) {
			res.setStatus(404);
			error.message = "We couldn't find your trip.";
		}
		next(error);
	}
};

export const inviteToTrip = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	const { email, tripId } = req.body;
	try {
		if (!email || typeof email !== 'string') {
			res.setStatus(403);
			throw new Error('Invalid email');
		}
		if (!tripId || typeof tripId !== 'string') {
			res.setStatus(403);
			throw new Error('Invalid trip id');
		}
		if (email === req.user?.email) {
			res.setStatus(403);
			throw new Error('This email is already a participant of this trip');
		}
		const invitee = await users()?.findOne(
			{ email },
			{ noCursorTimeout: false, projection: { _id: 1, firstName: 1 } }
		);
		const trip = await trips()
			?.aggregate([
				{
					$match: {
						_id: objectId(tripId),
						participants: Aggregation.matchElementById(req.user?.id)
					}
				},
				Aggregation.lookupUsers('participants'),
				Aggregation.inviteProjection
			])
			.next();
		if (!trip) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip");
		}
		const sender = `${req.user?.firstName} ${req.user?.lastName}`;
		if (!invitee) {
			const userId = await users()?.insertOne({ email });
			const key = encode(getId(userId));
			await trips()?.updateOne(Aggregation.byId(tripId), {
				$addToSet: { invitees: userId }
			});
			await sendMail(email, inviteNewUser(sender, key));
		} else {
			await trips()?.updateOne(Aggregation.byId(tripId), {
				$addToSet: { invitees: objectId(invitee._id) }
			});
			await sendMail(email, inviteExistingUser(sender, invitee));
		}
		res.json({ message: 'We sent an invite to this email address' });
		next();
	} catch (error) {
		if (error.message.includes('a Buffer or string of 12 bytes')) {
			res.setStatus(404);
			error.message = "We couldn't find your trip.";
		}
		next(error);
	}
};

export const updateTripInvitation = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	const { id } = req.params;
	const { action } = req.body;
	try {
		if (!id) {
			res.setStatus(403);
			throw new Error('Trip id is missing.');
		}
		if (action !== 'join' && action !== 'decline') {
			res.setStatus(403);
			throw new Error('Invalid action.');
		}
		const isInvited = trips()?.findOne(
			{ invitees: Aggregation.matchElementById(req?.user?.id) },
			FIND_OPTIONS
		);
		if (!isInvited) {
			res.setStatus(403);
			throw new Error('You are not invited to this trip.');
		}
		await trips()?.updateOne(Aggregation.byId(id), {
			$pull: { invitees: objectId(req.user?.id) },
			$addToSet:
				action === 'join' ? { participants: objectId(req.user?.id) } : {}
		});
		res.json({ message: 'Invitation updated' });
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
		const trip = await trips()?.findOne(Aggregation.byId(id), FIND_OPTIONS);

		if (!trip) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip");
		}

		const byAuthUser = (trip.participants as unknown[]).find(
			participant => getId(participant as unknown) === getId(req.user?.id)
		);
		if (!byAuthUser) {
			res.setStatus(403);
			throw new Error('a Trip can be removed only by one of its participant');
		}
		await trips()?.deleteOne(Aggregation.byId(id));
		res.json({ message: 'Trip has been removed Successfully' });
	} catch (error) {
		next(error);
	}
};
