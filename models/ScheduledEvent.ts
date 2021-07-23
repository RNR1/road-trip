import { getDb } from 'db';
import type { Collection } from 'mongo';
import { TripSchedule } from './TripSchedule.ts';

export interface ScheduledEvent {
	_id: { $oid: string };
	title: string;
	location: string;
	startDate: string;
	endDate: string;
	schedule: TripSchedule;
}

const scheduledEvents = (): Collection<ScheduledEvent> =>
	getDb().collection<ScheduledEvent>(
		'scheduledEvents'
	) as Collection<ScheduledEvent>;

export default scheduledEvents;
