import puppeteer from 'puppeteer';
import { format, difference } from 'datetime';
import * as logger from 'logger';
import type { ReservationSearchOptions, Reservation } from 'models';

type Node = {
	attributes: {
		content: { value: string };
		itemprop: { value: string };
		src: { value: string };
	};
	children: Node[];
	click: () => void;
	querySelector: (selector: string) => Node;
	querySelectorAll: (selector: string) => Node[];
	textContent: string;
	innerHTML: string;
};

enum Selector {
	Language = '[location="Language and currency"]',
	LanguageDialog = 'div[role="dialog"]',
	Location = '#bigsearch-query-detached-query',
	NextMonth = '[aria-label="Next"]',
	PrevMonth = '[aria-label="Previous"]',
	CheckIn = '[data-testid="structured-search-input-field-split-dates-0"]',
	CheckOut = '[data-testid="structured-search-input-field-split-dates-1"]',
	Guests = '[data-testid="structured-search-input-field-guests-button"]',
	AdultIncrementor = '[data-testid="stepper-adults-increase-button"]',
	SearchButton = 'button[data-testid=structured-search-input-search-button]',
	SearchResults = '[data-container-name="explore"]',
	SearchResult = '[itemprop="itemListElement"]'
}

const URL = 'https://www.airbnb.com/';

export async function searchInAirbnb(
	options: ReservationSearchOptions
): Promise<Reservation[]> {
	const { location, in: checkIn, out, for: guests } = options;
	const checkInDate = format(new Date(checkIn), 'yyyy-MM-dd');
	const { months = 0 } = difference(new Date(), new Date(checkIn), {
		units: ['months']
	});
	const checkInSelector = `[data-testid="datepicker-day-${checkInDate}"]`;
	const checkOutDate = format(new Date(out), 'yyyy-MM-dd');
	const { months: checkoutMonths = 0 } = difference(
		new Date(checkIn),
		new Date(out),
		{
			units: ['months']
		}
	);
	const checkOutSelector = `[data-testid="datepicker-day-${checkOutDate}"]`;
	const browser = await puppeteer.launch({
		headless: true,
		product: 'chrome',
		args: [
			'--no-sandbox',
			'--incognito',
			'--single-process',
			'--no-zygote',
			'--disable-setuid-sandbox',
			'--start-maximized',
			'--lang=en-US'
		]
	});
	logger.info('puppeteer - Launched browser.');
	try {
		const page = await browser.newPage();
		await page.setViewport({ width: 1280, height: 800 });
		logger.info('puppeteer - Opened a new page.');

		await page.goto(URL);
		logger.info(`puppeteer - Went to ${URL}`);

		await page.click(Selector.Location);
		await page.type(Selector.Location, location);
		logger.info(`puppeteer - Entered a location: ${location}.`);

		await page.click(Selector.CheckIn);
		logger.info(
			`puppeteer - Clicked on the check in button, looking for selector.`
		);

		await page.waitForSelector(Selector.NextMonth, { timeout: 1000 * 5 });
		for (let i = 0; i < months; i++) await page.click(Selector.NextMonth);
		await page.waitForSelector(checkInSelector, { timeout: 1000 * 5 });
		logger.info(`puppeteer - Selector found.`);

		await page.click(checkInSelector);

		for (let i = 0; i < checkoutMonths; i++)
			await page.click(Selector.NextMonth);

		await page.waitForSelector(checkOutSelector, { timeout: 1000 * 5 });
		await page.click(checkOutSelector, { delay: 1000 });
		logger.info(`puppeteer - Successfully entered check in and check out`);

		await page.click(Selector.Guests);
		await page.waitForSelector(Selector.AdultIncrementor, {
			timeout: 1000 * 5
		});
		for (let i = 0; i < guests; i += 1)
			await page.click(Selector.AdultIncrementor, { delay: 200 });
		logger.info(`puppeteer - Added amount of guests`);

		await page.click(Selector.SearchButton, { delay: 400 });
		logger.info(`puppeteer - Clicked search, waiting for selector`);

		await page.waitForSelector(Selector.SearchResult, { timeout: 1000 * 5 });

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
					url: `https://${
						children.find(item => item?.attributes.itemprop.value === 'url')
							?.attributes.content.value ?? ''
					}`,
					image: children[3].querySelector('img').attributes.src.value,
					description: content.children[0].children[0].children[0].textContent,
					properties: content.children[2].textContent?.split(' · '),
					services: content.children[3].textContent?.split(' · '),
					price: Number(
						children
							.find(
								item =>
									item.textContent.includes('₪') ||
									item.textContent.includes('$')
							)
							?.textContent.replace('/ night', '')
							?.split('$')[1]
							?.split(' ')[0]
					)
				};
			});
		});
		logger.info('puppeteer - Collected data successfully');
		return results as unknown as Reservation[];
	} catch (err) {
		logger.error(`puppeteer - ${err}`);
		throw new Error(
			'We had a problem fetching information from Airbnb, please try again'
		);
	} finally {
		await browser.close();
		logger.info(`puppeteer - Closed browser`);
	}
}
