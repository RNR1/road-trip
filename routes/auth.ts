import { Router } from 'opine';
import { Auth } from 'controller';
import { verifyPayload, verifyToken } from 'middleware';

const authRouter = Router();

authRouter.post('/signup', verifyPayload, Auth.signup);
authRouter.post('/login', verifyPayload, Auth.login);
authRouter.get('/verify', verifyToken, Auth.returnToken);

export default authRouter;
