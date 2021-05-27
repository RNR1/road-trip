import { getDb } from 'db';

export interface User {
	_id: { $oid: string };
	email: string;
	password: string;
}

const users = () => getDb()?.collection<User>('users');

export default users;
