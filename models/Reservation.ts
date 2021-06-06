export interface ReservationSearchOptions {
	location: string;
	in: string;
	out: string;
	for: number;
}

export interface Reservation {
	title: string;
	url: string;
	image: string;
	description: string;
	properties: string[];
	services: string[];
	price: number | null;
}
