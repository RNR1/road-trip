import * as log from 'logger';
import { RequestHandler } from 'opine';

const logger: RequestHandler = (req, res, next) => {
	log.info(
		`${req.method} ${req.path} ${
			res.status
		} ${new Date().toDateString()} ${new Date().toTimeString()}`
	);
	next();
};

export default logger;
