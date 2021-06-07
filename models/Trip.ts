import { getDb } from 'db';
import { Collection } from 'https://deno.land/x/mongo@v0.23.1/src/collection/mod.ts';
import { Note } from './Note.ts';
import { Track } from './Track.ts';
export interface Trip {
	_id: { $oid: string };
	notes: Note[];
	track: Track;
}

const trips = (): Collection<Trip> => getDb()?.collection<Trip>('trips');

export default trips;
