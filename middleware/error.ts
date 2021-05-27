import type { ErrorRequestHandler } from 'opine';

const errorHandler: ErrorRequestHandler = (err, _, res, next) => {
	if (res.status === 200) res.setStatus(500);
	res.json({ message: err.message });
	next();
};

export default errorHandler;
