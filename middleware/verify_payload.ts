import type { RequestHandler } from 'opine';

const verifyPayload: RequestHandler = (req, res, next) => {
	if (req.is('application/json') || req.method === 'OPTIONS') return next();
	res.setStatus(415);
	next(new Error('Payload not supported'));
};

export default verifyPayload;
