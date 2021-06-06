import { RequestHandler } from 'opine';
import { searchInAirBnB } from 'scraper';
import type { Reservation, ReservationSearchOptions } from 'models';

export const search: RequestHandler<
	Record<string, string>,
	{ message: string; results: Reservation[] },
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
	res.json({
		message: 'Here are the relevant results we found on AirBnB',
		results
	});
	next();
};
