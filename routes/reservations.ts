import { Router } from 'opine';
import { Reservations } from 'controller';
import { verifyPayload, verifyToken } from 'middleware';

export const reservationsRouter = Router();

reservationsRouter.get('/search', verifyToken, Reservations.search);

export default reservationsRouter;
