import { Router } from 'opine';
import { Auth } from 'controller';

const authRouter = Router();

authRouter.post('/signup', Auth.signup);
authRouter.post('/login', Auth.login);

export default authRouter;
