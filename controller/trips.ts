import { encode } from 'base64';
import { uploadImage } from 'cloudinary';
import { format } from 'datetime';
import { getId, objectId } from 'db';
import { sendMail } from 'emails';
import type { TokenRequest } from 'middleware';
import { trips, users } from 'models';
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
					participants: {
						$elemMatch: { $eq: objectId(req.user?.id) }
					}
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
							$elemMatch: { $eq: objectId(req.user?.id) }
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
					$lookup: {
						from: 'users',
						localField: 'invitees',
						foreignField: '_id',
						as: 'invitees'
					}
				},
				{
					$project: {
						participants: {
							password: 0,
							email: 0,
							createdAt: 0
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

export const getTripInvitations = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const results = await trips()
			?.find(
				{
					invitees: {
						$elemMatch: { $eq: objectId(req.user?.id) }
					}
				},
				{ noCursorTimeout: false }
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
						participants: {
							$elemMatch: { $eq: objectId(req.user?.id) }
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
		if (!trip) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip");
		}
		const sender = `${req.user?.firstName} ${req.user?.lastName}`;
		const subject = `${sender} invited you to join his trip!`;
		const baseContent = `
		<h1>An invitation to join On The Road platform</h1>
		<p>
			Hello${invitee ? `, ${invitee.firstName}` : ''}! 
			this is an invitation from ${sender} to join his trip.
		</p>`;
		if (!invitee) {
			const userId = await users()?.insertOne({ email });
			const key = encode(getId(userId));
			await trips()?.updateOne(
				{ _id: objectId(tripId) },
				{ $addToSet: { invitees: userId } }
			);
			sendMail({
				to: email,
				subject,
				content: `
				${baseContent}
				<p>
					To proceed, you can 
						<a href="https://road-trip-client.vercel.app/signup?key=${key}">
							create an account
						</a> 
					in our platform.
				</p>`
			});
		} else {
			await trips()?.updateOne(
				{ _id: objectId(tripId) },
				{ $addToSet: { invitees: objectId(invitee._id) } }
			);
			sendMail({
				to: email,
				subject,
				content: `${baseContent}<p>To proceed, you can <a href="https://road-trip-client.vercel.app/trips/invitations">view your trip invitations</a> in our platform.</p>`
			});
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
			{
				invitees: {
					$elemMatch: { $eq: objectId(req.user?.id) }
				}
			},
			{ noCursorTimeout: false }
		);
		if (!isInvited) {
			res.setStatus(403);
			throw new Error('You are not invited to this trip.');
		}
		await trips()?.updateOne(
			{ _id: objectId(id) },
			{
				$pull: { invitees: objectId(req.user?.id) },
				$addToSet:
					action === 'join' ? { participants: objectId(req.user?.id) } : {}
			}
		);
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
		const trip = await trips()?.findOne(
			{ _id: objectId(id) },
			{ noCursorTimeout: false }
		);

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
		await trips()?.deleteOne({ _id: objectId(id) });
		res.json({ message: 'Trip has been removed Successfully' });
	} catch (error) {
		next(error);
	}
};
