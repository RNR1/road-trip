import { Router } from 'opine';
import { Auth } from 'controller';
import { verifyPayload } from 'middleware';

const authRouter = Router();

authRouter.post('/signup', verifyPayload, Auth.signup);
authRouter.post('/login', Auth.login);

export default authRouter;
