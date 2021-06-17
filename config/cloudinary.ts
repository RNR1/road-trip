import 'loadEnv';
import * as log from 'logger';
import { sha1 } from 'sha1';
import type { UploadAPIResponse } from 'types/cloudinary';

const CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME');
const API_KEY = Deno.env.get('CLOUDINARY_API_KEY');
const API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');
const UPLOAD_URI = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

function validateKeys() {
	if (!API_KEY || !API_SECRET || !CLOUD_NAME)
		throw new Error('Cloudinary resources are missing');
}

export function getUploadURI() {
	try {
		validateKeys();
		return UPLOAD_URI;
	} catch (err) {
		log.error(err);
	}
}

function createSignature(publicId: string, timestamp: number, eager: string) {
	const input = `eager=${eager}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
	return sha1(input, 'utf8', 'hex');
}

export async function uploadImage(
	file: string,
	eager = 'w_100,h_100,c_thumb,g_face,r_max'
): Promise<UploadAPIResponse> {
	const URL = getUploadURI();
	const timestamp = Date.now();
	const publicId = `avatar_${timestamp}`;
	const signature = createSignature(publicId, timestamp, eager);

	const response = await fetch(URL ?? '', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			file,
			timestamp,
			api_key: API_KEY,
			public_id: publicId,
			eager,
			signature
		})
	});
	return await response.json();
}
