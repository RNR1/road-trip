import * as Aggregation from 'aggregations';
import { FIND_OPTIONS, getId, objectId } from 'db';
import { TokenRequest } from 'middleware';
import { Response, NextFunction } from 'opine';
import { TripPlan, tripPlans, Waypoint, waypoints as Waypoints } from 'models';

export const getTripPlan = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const result = await tripPlans()
			?.aggregate([
				Aggregation.matchById(id),
				...Aggregation.lookupTrip,
				Aggregation.matchByParticipant(req?.user?.id),
				Aggregation.lookupWaypoints,
				Aggregation.getTripPlanProjection
			])
			.next();

		if (!result) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip plan.");
		}
		res.json(result);
		next();
	} catch (error) {
		if (error.message.includes('a Buffer or string of 12 bytes')) {
			res.setStatus(404);
			error.message = "We couldn't find your trip plan.";
		}
		next(error);
	}
};

export const savePlan = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const {
			origin,
			waypoints = [],
			destination,
			maxHoursPerDay
		} = req.body as Partial<TripPlan>;
		if (!origin?.trim?.()?.length) {
			res.setStatus(403);
			throw new Error('Origin is required');
		}
		if (!destination?.trim?.()?.length) {
			res.setStatus(403);
			throw new Error('Destination is required');
		}
		if (
			typeof maxHoursPerDay !== 'undefined' &&
			(typeof maxHoursPerDay !== 'number' ||
				maxHoursPerDay < 1 ||
				maxHoursPerDay > 15)
		) {
			res.setStatus(403);
			throw new Error(
				'Your driving hours per day has to be a number between 1 and 15'
			);
		}
		const tripPlan = await tripPlans()
			?.aggregate([
				Aggregation.matchById(id),
				...Aggregation.lookupTrip,
				Aggregation.matchByParticipant(req?.user?.id),
				Aggregation.lookupWaypoints,
				Aggregation.savePlanProjection
			])
			.next();
		if (!tripPlan) {
			res.setStatus(404);
			throw new Error("We couldn't find your trip plan");
		}
		const upsertedIds: unknown[] = [];
		for (const waypoint of waypoints) {
			let instance = await Waypoints()?.findOne(
				{ location: waypoint.location },
				FIND_OPTIONS
			);
			if (!instance) {
				instance = (await Waypoints()?.insertOne({
					location: waypoint.location,
					stopover: waypoint.stopover,
					tripPlans: [objectId(tripPlan._id)]
				})) as Waypoint;
			} else {
				const existsInPlan = instance.tripPlans.find(
					plan => getId(plan) === getId(tripPlan._id)
				);
				if (!existsInPlan) {
					await Waypoints()?.updateOne(
						{ _id: instance._id },
						{ $addToSet: { tripPlans: objectId(tripPlan._id) } }
					);
				}
			}
			if (instance) upsertedIds.push(instance._id ?? instance);
		}

		await tripPlans().updateOne(
			{ _id: tripPlan._id },
			{
				$set: {
					origin: origin ?? tripPlan.origin,
					waypoints: upsertedIds,
					destination: destination ?? tripPlan.destination,
					maxHoursPerDay: maxHoursPerDay ?? 5,
					updatedAt: new Date().toISOString()
				}
			}
		);

		res.json({ message: 'We saved your trip plan' });
	} catch (error) {
		next(error);
	}
};
