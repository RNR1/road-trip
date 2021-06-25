import { getId, objectId } from 'db';
import type { TokenRequest } from 'middleware';
import { notes, trips } from 'models';
import { Response, NextFunction } from 'opine';
import type { Note } from 'models';

export const getNotes = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const results = await notes()
			?.find(
				{
					createdBy: objectId(req.user?.id)
				},
				{ noCursorTimeout: false }
			)
			.sort({ updatedAt: -1 })
			.toArray();
		res.json(results);
		next();
	} catch (error) {
		next(error);
	}
};

export const getNote = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const result = await notes()
			?.aggregate([
				{
					$match: {
						_id: objectId(id),
						createdBy: objectId(req.user?.id)
					}
				},
				{
					$lookup: {
						from: 'trips',
						localField: 'trip',
						foreignField: '_id',
						as: 'trip'
					}
				},
				{
					$project: {
						trip: {
							description: 0,
							participants: 0,
							invitees: 0,
							notes: 0
						}
					}
				},
				{
					$unwind: { path: '$trip' }
				}
			])
			.next();
		if (!result) {
			res.setStatus(404);
			throw new Error("We couldn't find your note.");
		}
		res.json(result);
		next();
	} catch (error) {
		if (error.message.includes('a Buffer or string of 12 bytes')) {
			res.setStatus(404);
			error.message = "We couldn't find your note.";
		}
		next(error);
	}
};

export const addNote = async (
	req: TokenRequest,
	res: Response<{ message: string; id: string }>,
	next: NextFunction
) => {
	try {
		const { title, content, trip } = req.body as Partial<Note>;
		if (!content || typeof content !== 'string') {
			res.setStatus(403);
			throw new Error('Content is missing.');
		}
		if (!trip || typeof trip !== 'string') {
			res.setStatus(403);
			throw new Error('Trip is missing');
		}
		const createdAt = new Date().toISOString();
		const note = await notes()?.insertOne({
			title,
			content,
			trip: objectId(trip),
			createdBy: objectId(req.user?.id),
			createdAt,
			updatedAt: createdAt
		});
		await trips()?.updateOne(
			{ _id: objectId(trip) },
			{ $push: { notes: note } }
		);

		res.setStatus(201).json({
			message: 'Note has been created Successfully!',
			id: getId(note)
		});
	} catch (error) {
		if (error.message.includes('a Buffer or string of 12 bytes')) {
			res.setStatus(404);
			error.message = "We couldn't find your trip.";
		}
		next(error);
	}
};

export const updateNote = async (
	req: TokenRequest,
	res: Response<{ message: string }>,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const { title, content } = req.body as Partial<Note>;
		const note = await notes()?.findOne(
			{ _id: objectId(id) },
			{ noCursorTimeout: false }
		);

		if (!note) {
			res.setStatus(404);
			throw new Error("We couldn't find your note");
		}

		const byAuthUser = getId(note.createdBy) === getId(req.user?.id);

		if (!byAuthUser) {
			res.setStatus(403);
			throw new Error('a Note can be updated only by its creator');
		}

		await notes()?.updateOne(
			{ _id: note._id },
			{
				$set: {
					title: title ?? note.title,
					content: content ?? note.content,
					updatedAt: new Date().toISOString()
				}
			}
		);

		res.json({ message: 'We updated your note' });
	} catch (error) {
		next(error);
	}
};

export const removeNote = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const note = await notes()?.findOne(
			{ _id: objectId(id) },
			{ noCursorTimeout: false }
		);

		if (!note) {
			res.setStatus(404);
			throw new Error("We couldn't find your note");
		}

		const byAuthUser = getId(note.createdBy) === getId(req.user?.id);
		if (!byAuthUser) {
			res.setStatus(403);
			throw new Error('a Note can be removed only by one of its participant');
		}

		await notes()?.deleteOne({ _id: objectId(id) });
		await trips()?.updateOne(
			{ notes: { $elemMatch: { $eq: objectId(id) } } },
			{ $pull: { notes: objectId(id) } }
		);
		res.json({ message: 'Note has been removed Successfully' });
	} catch (error) {
		next(error);
	}
};
