import type { ErrorRequestHandler } from 'opine';
import * as logger from 'logger';

const errorHandler: ErrorRequestHandler = (err, _, res, next) => {
	if (res.status === 200) res.setStatus(500);
	logger.error(`${res.status} - ${err.message}`);
	res.json({ message: err.message });
	next();
};

export default errorHandler;
