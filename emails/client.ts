import 'loadEnv';
import { SMTPClient, SendConfig } from 'mailer';

export const sendMail = async (
	to: string,
	data: Omit<SendConfig, 'from' | 'to'>
) => {
	let client = new SMTPClient({
		connection: {
			hostname: 'smtp.sendgrid.net',
			port: 465,
			tls: true,
			auth: {
				username: Deno.env.get('SENDGRID_USERNAME'),
				password: Deno.env.get('SENDGRID_PASSWORD')
			}
		}
	});

	try {
		await client.send({
			from: `Ron from On the road <${Deno.env.get('GMAIL_USERNAME')}>`,
			to,
			...data
		});
	} catch (error) {
		throw error;
	} finally {
		await client.close();
	}
};
