import { RequestHandler } from 'opine';
import { searchInAirBnB, ReservationSearchOptions } from 'scraper';

export const search: RequestHandler<
	Record<string, string>,
	{ message: string; results: unknown },
	ReservationSearchOptions
> = async (req, res, next) => {
	const { location, in: checkIn, out, for: guests } = req.query;
	const options = { location, in: checkIn, out, for: Number(guests) };
	const isMissing = Object.entries(options).find(([_, val]) => !val);
	if (isMissing) {
		const [key] = isMissing;
		res.setStatus(400);
		throw new Error(`Param '${key}' is missing.`);
	}
	const results = await searchInAirBnB(options);
	res.json({ message: 'In progress', results });
	next();
};
