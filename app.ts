import { opine } from 'opine';
import { config } from 'dotenv';
import { opineCors } from 'cors';
import { auth } from '/routes/index.ts';

config();

const port = Number(Number(config().PORT));

const app = opine();

app.use(opineCors());
app.use('/auth', auth);
app.get('/', function (req, res) {
	res.send('Soon to be an app!');
});

app.listen(port, () =>
	console.log(`server has started on http://localhost:${port} 🚀`)
);
