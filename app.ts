import { opine, json, serveStatic } from 'opine';
import { opineCors } from 'cors';
import { config } from 'dotenv';
import { connect } from 'db';
import { errorHandler, logger } from 'middleware';
import { auth } from 'routes';

config();
connect();

const port = Number(Deno.env.get('PORT'));
const app = opine();

app.use(opineCors());
app.use(logger);
app.use(json());

app.use('/api/auth', auth);
app.use('/', serveStatic('static'));
app.use(errorHandler);
app.use(logger);

app.listen(port, () => console.log(`server has started on port ${port} 🚀`));
