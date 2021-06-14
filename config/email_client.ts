import 'loadEnv';
import { SmtpClient, SendConfig } from 'smtp';

const sendMail = async (data: Omit<SendConfig, 'from'>) => {
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
			...data
		});
	} catch (error) {
		throw error;
	} finally {
		await client.close();
	}
};

export { sendMail };
