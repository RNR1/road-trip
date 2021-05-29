import { getDb } from 'db';
import { Trip } from './Trip.ts';

export interface User {
	_id: { $oid: string };
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	trips: Trip[];
}

const users = () => getDb()?.collection<User>('users');

export default users;
