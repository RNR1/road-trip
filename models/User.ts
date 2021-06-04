import { getDb } from 'db';
import { Trip } from './Trip.ts';

export interface User {
	_id: { $oid: string };
	avatar: string;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	trips: Trip[];
}

export type AuthResponse = {
	message: string;
	token?: string;
	id?: string;
} & Partial<User>;

const users = () => getDb()?.collection<User>('users');

export default users;
