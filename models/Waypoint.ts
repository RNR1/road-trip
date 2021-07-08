import { getDb } from 'db';
import { Collection } from 'mongo/collection';
import { TripPlan } from './TripPlan.ts';

export interface Waypoint {
	_id: { $oid: string };
	location: string;
	stopover: boolean;
	tripPlans: TripPlan[];
}

const waypoints = (): Collection<Waypoint> =>
	getDb().collection<Waypoint>('waypoints') as Collection<Waypoint>;

export default waypoints;
