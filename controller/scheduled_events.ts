import * as Aggregate from 'aggregations';
import { objectId } from 'db';
import { TokenRequest } from 'middleware';
import { ScheduledEvent, scheduledEvents, tripSchedules } from 'models';
import { Response, NextFunction } from 'opine';

export const getScheduledEvent = async (
	req: TokenRequest,
	res: Response<ScheduledEvent>,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const result = await scheduledEvents()
			?.aggregate([
				Aggregate.matchById(id),
				...Aggregate.lookupTripSchedule,
				Aggregate.matchByParticipant(req.user?.id),
				Aggregate.getScheduledEventProjection
			])
			.next();
		if (!result) {
			res.setStatus(404);
			throw new Error("We couldn't find your event.");
		}
		res.json(result);
		next();
	} catch (error) {
		if (error.message.includes('a Buffer or string of 12 bytes')) {
			res.setStatus(404);
			error.message = "We couldn't find your event.";
		}
		next(error);
	}
};

export const addEvent = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const {
			title = 'New Event',
			location,
			startDate,
			endDate,
			schedule
		} = req.body as Partial<ScheduledEvent & { schedule: string }>;
		if (!startDate || !endDate) {
			res.setStatus(403);
			throw new Error('Please specify a valid date range.');
		}
		const [startTimeStamp, endTimeStamp] = [
			new Date(startDate).getTime(),
			new Date(endDate).getTime()
		];
		if (
			Number.isNaN(startTimeStamp) ||
			Number.isNaN(endTimeStamp) ||
			startTimeStamp > endTimeStamp
		) {
			res.setStatus(403);
			throw new Error('Please specify a valid date range.');
		}
		const result = await tripSchedules()
			?.aggregate([
				Aggregate.matchById(schedule as string),
				...Aggregate.lookupTrip,
				Aggregate.matchByParticipant(req.user?.id),
				Aggregate.getTripScheduleProjection
			])
			.next();
		if (!result) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip schedule.");
		}
		const scheduledEvent = await scheduledEvents?.()?.insertOne({
			title,
			location,
			startDate,
			endDate,
			schedule: objectId(schedule)
		});
		tripSchedules()?.updateOne(Aggregate.byId(schedule), {
			$push: { events: scheduledEvent }
		});
		res.json({
			message: 'Your event has been added successfully.',
			scheduledEvent
		});
	} catch (error) {
		next(error);
	}
};

export const updateEvent = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const { title, location, startDate, endDate } =
			req.body as Partial<ScheduledEvent>;
		if (startDate || endDate) {
			const [startTimeStamp, endTimeStamp] = [
				new Date(startDate ?? '').getTime(),
				new Date(endDate ?? '').getTime()
			];
			if (
				Number.isNaN(startTimeStamp) ||
				Number.isNaN(endTimeStamp) ||
				startTimeStamp > endTimeStamp
			) {
				res.setStatus(403);
				throw new Error('Please specify a valid date range.');
			}
		}
		const prev = await scheduledEvents()
			?.aggregate([
				Aggregate.matchById(id),
				...Aggregate.lookupTripSchedule,
				Aggregate.matchByParticipant(req.user?.id),
				Aggregate.getScheduledEventProjection
			])
			.next();
		if (!prev) {
			res.setStatus(404);
			throw new Error("We couldn't find your event.");
		}
		await scheduledEvents?.()?.updateOne(Aggregate.byId(id), {
			$set: {
				title: title ?? prev.title,
				location: location ?? prev.location,
				startDate: startDate ?? prev.startDate,
				endDate: endDate ?? prev.endDate
			}
		});
		res.json({ message: 'Your event has been updated successfully!' });
	} catch (error) {
		next(error);
	}
};

export const deleteEvent = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const prev = await scheduledEvents()
			?.aggregate([
				Aggregate.matchById(id),
				...Aggregate.lookupTripSchedule,
				Aggregate.matchByParticipant(req.user?.id),
				Aggregate.getScheduledEventProjection
			])
			.next();
		if (!prev) {
			res.setStatus(404);
			throw new Error("We couldn't find your event.");
		}
		const pullEventFromTripSchedule = { $pull: { events: objectId(id) } };
		await tripSchedules()?.updateOne(
			Aggregate.byId(prev?.schedule._id),
			pullEventFromTripSchedule
		);
		await scheduledEvents()?.deleteOne(Aggregate.byId(id));
		res.json({ message: 'Your event has been deleted successfully!' });
	} catch (error) {
		next(error);
	}
};
