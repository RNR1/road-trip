import { getDb } from 'db';
import { Collection } from 'mongo/collection';
import { User } from './User.ts';
import { Note } from './Note.ts';
import { Track } from './Track.ts';
export interface Trip {
	_id: { $oid: string };
	name: string;
	participants: User[];
	notes: Note[];
	track: Track;
}

const trips = (): Collection<Trip> =>
	getDb()?.collection<Trip>('trips') as Collection<Trip>;

export default trips;
