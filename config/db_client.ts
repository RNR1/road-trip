import 'loadEnv';
import { MongoClient, Bson } from 'mongo';
import type { Database } from 'mongo/database';
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

export function getId(_id: { $oid: string }): string {
	return new Bson.ObjectID(_id).toHexString();
}
