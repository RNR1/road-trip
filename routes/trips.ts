import { Router } from 'opine';
import { verifyToken, verifyPayload } from 'middleware';
import { Trips } from 'controller';

export const tripsRouter = Router();

tripsRouter.get('/', verifyToken, Trips.getTrips);
tripsRouter.get('/:id', verifyToken, Trips.getTrip);
tripsRouter.post('/', verifyPayload, verifyToken, Trips.addTrip);
tripsRouter.delete('/:id', verifyToken, Trips.removeTrip);

export default tripsRouter;
