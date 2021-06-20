import { Router } from 'opine';
import { verifyToken, verifyPayload } from 'middleware';
import { Trips } from 'controller';

export const tripsRouter = Router();

tripsRouter.get('/invites', verifyToken, Trips.getTripInvitations);
tripsRouter.post('/invites', verifyPayload, verifyToken, Trips.inviteToTrip);
tripsRouter.put(
	'/invites/:id',
	verifyPayload,
	verifyToken,
	Trips.updateTripInvitation
);
tripsRouter.post('/', verifyPayload, verifyToken, Trips.addTrip);
tripsRouter.get('/', verifyToken, Trips.getTrips);
tripsRouter.get('/:slug', verifyToken, Trips.getTrip);
tripsRouter.patch('/:slug', verifyPayload, verifyToken, Trips.updateTrip);
tripsRouter.delete('/:id', verifyToken, Trips.removeTrip);

export default tripsRouter;
