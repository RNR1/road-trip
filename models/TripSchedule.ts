import { getDb } from 'db';
import type { Collection } from 'mongo';
import { ScheduledEvent } from './ScheduledEvent.ts';
import { Trip } from './Trip.ts';

export interface TripSchedule {
	_id: { $oid: string };
	events: ScheduledEvent[];
	trip: Trip;
}

const tripSchedules = (): Collection<TripSchedule> =>
	getDb().collection<TripSchedule>('tripSchedules') as Collection<TripSchedule>;

export default tripSchedules;
