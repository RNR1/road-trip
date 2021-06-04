import { RequestHandler } from 'opine';
import { goToAirBnB } from 'scraper';

export const search: RequestHandler<
	Record<string, string>,
	{ message: string }
> = async (req, res, next) => {
	await goToAirBnB();
	res.json({ message: 'In progress' });
	next();
};
