import { getDb } from 'db';
import { Collection } from 'mongo/collection';
import { Trip } from './Trip.ts';
import { Waypoint } from './Waypoint.ts';

export interface TripPlan {
	_id: { $oid: string };
	origin: string;
	waypoints: Waypoint[];
	destination: string;
	trip: Trip;
}

const tripPlans = (): Collection<TripPlan> =>
	getDb().collection<TripPlan>('tripPlans') as Collection<TripPlan>;

export default tripPlans;
