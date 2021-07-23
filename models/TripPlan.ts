import { getDb } from 'db';
import type { Collection } from 'mongo';
import { Trip } from './Trip.ts';
import { Waypoint } from './Waypoint.ts';

export interface TripPlan {
	_id: { $oid: string };
	origin: string;
	waypoints: Waypoint[];
	destination: string;
	maxHoursPerDay: number;
	trip: Trip;
}

const tripPlans = (): Collection<TripPlan> =>
	getDb().collection<TripPlan>('tripPlans') as Collection<TripPlan>;

export default tripPlans;
