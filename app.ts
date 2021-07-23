import { opine, json } from 'opine';
import { opineCors } from 'cors';
import { config } from 'dotenv';
import { parse } from 'flags';
import { connect } from 'db';
import { errorHandler, logger } from 'middleware';
import * as Router from 'routes';

config();
connect();

const app = opine();

app.use(opineCors());
app.use(logger);
app.use(json());

app.use('/api/auth', Router.auth);
app.use('/api/notes', Router.notes);
app.use('/api/reservations', Router.reservations);
app.use('/api/scheduledEvents', Router.scheduledEvents);
app.use('/api/trips', Router.trips);
app.use('/api/tripPlans', Router.tripPlans);
app.use('/api/tripSchedules', Router.tripSchedules);

app.get('/', (_, res) =>
	res.send('On the road API, you are probably not looking for us.')
);
app.use(errorHandler);
app.use(logger);

const port = Number(Deno.env.get('PORT'));
const { args } = Deno;
const argPort = parse(args).port;
app.listen(argPort ? Number(argPort) : port, () =>
	console.log(`Server started on port ${port}`)
);

export default app;
