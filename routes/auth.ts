import { Router } from 'opine';

const authRouter = Router();

authRouter.post('/signup', (req, res, next) => {
	res.send('authenticated! (not)');
});

authRouter.post('/login', (req, res, next) => {
	res.send('authenticated! (not)');
});

export default authRouter;
