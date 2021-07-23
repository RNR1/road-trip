import * as Aggregate from 'aggregations';
import { TokenRequest } from 'middleware';
import { Response, NextFunction } from 'opine';
import { TripSchedule, tripSchedules } from 'models';

export const getTripSchedule = async (
	req: TokenRequest,
	res: Response<TripSchedule>,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const result = await tripSchedules()
			?.aggregate([
				Aggregate.matchById(id),
				...Aggregate.lookupTrip,
				Aggregate.matchByParticipant(req.user?.id),
				Aggregate.lookupEvents,
				Aggregate.getTripScheduleProjection
			])
			.next();
		if (!result) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip schedule.");
		}
		res.json(result);
		next();
	} catch (error) {
		if (error.message.includes('a Buffer or string of 12 bytes')) {
			res.setStatus(404);
			error.message = "We couldn't find your trip schedule.";
		}
		next(error);
	}
};
