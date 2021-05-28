import { opine, json, serveStatic } from 'opine';
import { opineCors } from 'cors';
import { config } from 'dotenv';
import { connect } from 'db';
import { errorHandler, logger } from 'middleware';
import { auth } from 'routes';

config();
connect();

const app = opine();

app.use(opineCors());
app.use(logger);
app.use(json());

app.use('/api/auth', auth);
app.use('/', serveStatic('static'));
app.use(errorHandler);
app.use(logger);

if (import.meta.main) {
	const server = app.listen();
	const address = server.listener.addr as Deno.NetAddr;
	console.log(`Server started on ${address.hostname}:${address.port}`);
}

export default app;
