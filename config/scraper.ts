import puppeteer from 'puppeteer';
import { format } from 'datetime';
import * as logger from 'logger';

type Node = {
	attributes: {
		content: { value: string };
		itemprop: { value: string };
		src: { value: string };
	};
	children: Node[];
	querySelector: (selector: string) => Node;
	textContent: string;
	innerHTML: string;
};

enum Selector {
	Location = '#bigsearch-query-detached-query',
	CheckIn = '[data-testid="structured-search-input-field-split-dates-0"]',
	CheckOut = '[data-testid="structured-search-input-field-split-dates-1"]',
	Guests = '[data-testid="structured-search-input-field-guests-button"]',
	AdultIncrementor = '[data-testid="stepper-adults-increase-button"]',
	SearchButton = 'button[data-testid=structured-search-input-search-button]',
	SearchResults = '[data-container-name="explore"]',
	SearchResult = '[itemprop="itemListElement"]'
}

const URL = 'https://www.airbnb.com/';

export type ReservationSearchOptions = {
	location: string;
	in: string;
	out: string;
	for: number;
};

export async function searchInAirBnB(options: ReservationSearchOptions) {
	const { location, in: checkIn, out, for: guests } = options;
	const checkInDate = format(new Date(checkIn), 'yyyy-MM-dd');
	const checkInSelector = `[data-testid="datepicker-day-${checkInDate}"]`;
	const checkOutDate = format(new Date(out), 'yyyy-MM-dd');
	const checkOutSelector = `[data-testid="datepicker-day-${checkOutDate}"]`;
	const browser = await puppeteer.launch();
	logger.info('puppeteer - Launched browser.');
	try {
		const page = await browser.newPage();
		await page.setViewport({ width: 1280, height: 800 });
		logger.info('puppeteer - Opened a new page.');

		await page.goto(URL);
		logger.info(`puppeteer - Went to ${URL}`);

		await page.type(Selector.Location, location);
		logger.info(`puppeteer - Entered a location.`);

		await page.click(Selector.CheckIn);
		logger.info(
			`puppeteer - Clicked on the check in button, looking for selector.`
		);

		await page.waitForSelector(checkInSelector, { timeout: 1000 * 10 });
		logger.info(`puppeteer - Selector found.`);

		await page.click(checkInSelector);
		await page.click(checkOutSelector, { delay: 1000 });
		logger.info(`puppeteer - Successfully entered check in and check out`);

		await page.click(Selector.Guests);
		for (let i = 0; i < guests; i += 1)
			await page.click(Selector.AdultIncrementor, { delay: 200 });
		logger.info(`puppeteer - Added amount of guests`);

		await page.click(Selector.SearchButton, { delay: 400 });
		logger.info(`puppeteer - Clicked search, waiting for selector`);

		await page.waitForSelector(Selector.SearchResult, { timeout: 1000 * 10 });

		logger.info(`puppeteer - Collecting data`);
		const results = await page.$$eval(Selector.SearchResult, nodes => {
			return nodes.map((node: { children: Node[] }) => {
				const children = Array.from(node.children);
				const content =
					children[3].querySelector('div[role="group"]').children[2];

				return {
					title: children.find(
						item => item?.attributes.itemprop.value === 'name'
					)?.attributes.content.value as string,
					url: children.find(item => item?.attributes.itemprop.value === 'url')
						?.attributes.content.value,
					image: children[3].querySelector('img').attributes.src.value,
					description: content.children[0].children[0].children[0].textContent,
					properties: content.children[2].textContent.split(' · '),
					services: content.children[3].textContent.split(' · '),
					price: Number(
						children
							.find(
								item =>
									item.textContent.includes('₪') ||
									item.textContent.includes('$')
							)
							?.textContent.replace('/ night', '')
							.split('₪')[1]
							.split(' ')[0]
					)
				};
			});
		});
		logger.info('puppeteer - Collected data successfully');
		return results;
	} catch (err) {
		logger.error(`puppeteer - ${err}`);
		throw new Error(
			'We had a problem fetching information from AirBnB, please try again'
		);
	} finally {
		await browser.close();
		logger.info(`puppeteer - Closed browser`);
	}
}