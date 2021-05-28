import { opine, json } from 'opine';
import { config } from 'dotenv';
import { opineCors } from 'cors';
import { connect } from 'db';
import { errorHandler, logger, verifyPayload } from 'middleware';
import { auth } from 'routes';

config();
connect();

const port = Number(Number(config().PORT));
const app = opine();

app.use(opineCors());
app.use(logger);
app.use(verifyPayload);
app.use(json());

app.use('/api/auth', auth);
app.use(errorHandler);
app.use(logger);

app.listen(port, () => console.log(`server has started on port ${port} 🚀`));
