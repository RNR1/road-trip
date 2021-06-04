import puppeteer from 'puppeteer';

export async function goToAirBnB() {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://www.airbnb.com/');

	await page.screenshot({ path: 'screenshot.png' });
}
