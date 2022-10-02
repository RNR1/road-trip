import 'loadEnv';
import { MongoClient, ObjectId } from 'mongo';
import type { Database } from 'mongo';
import * as log from 'logger';

let db: Database;

export async function connect() {
	try {
		const client = new MongoClient();
		const mongoURI = Deno.env.get('MONGODB_URI');
		if (!mongoURI) throw new Error('Missing MongoDB URI');
		await client.connect(mongoURI);
		db = client.database('roadTrip');
		log.info('Connected to MongoDB');
	} catch (err) {
		log.error(err.message);
	}
}

export function getDb(): Database {
	return db;
}

export function getId(_id: { $oid: string } | unknown): string {
	return new ObjectId(_id).toHexString();
}

export function objectId(id: string | unknown): ObjectId {
	return new ObjectId(id);
}
