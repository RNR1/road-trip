import 'loadEnv';
import { SmtpClient, SendConfig } from 'smtp';

export const sendMail = async (
	to: string,
	data: Omit<SendConfig, 'from' | 'to'>
) => {
	const client = new SmtpClient();
	try {
		await client.connectTLS({
			hostname: 'smtp.gmail.com',
			port: 465,
			username: Deno.env.get('GMAIL_USERNAME'),
			password: Deno.env.get('GMAIL_PASSWORD')
		});
		await client.send({
			from: 'Ron from On the road',
			to,
			...data
		});
	} catch (error) {
		throw error;
	} finally {
		await client.close();
	}
};
