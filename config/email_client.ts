import 'loadEnv';
import { SmtpClient } from 'smtp';

const client = new SmtpClient();
await client.connectTLS({
	hostname: 'smtp.gmail.com',
	port: 465,
	username: Deno.env.get('GMAIL_USERNAME'),
	password: Deno.env.get('GMAIL_PASSWORD')
});

type MailOptions = { to: string; subject: string; content: string };

const sendMail = async (data: MailOptions) => {
	await client.send({
		from: 'Ron from On the road',
		...data
	});
	await client.close();
};

export { sendMail };
