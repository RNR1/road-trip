import { getDb } from 'db';

export interface Trip {
	_id: { $oid: string };
}

const trips = () => getDb()?.collection<Trip>('trips');

export default trips;
