import { Router } from 'opine';
import { Reservations } from 'controller';
import { verifyToken } from 'middleware';

const reservationsRouter = Router();

reservationsRouter.get('/search', verifyToken, Reservations.search);

export default reservationsRouter;
