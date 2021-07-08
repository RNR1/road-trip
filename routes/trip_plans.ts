import { Router } from 'opine';
import { verifyToken, verifyPayload } from 'middleware';
import { TripPlans } from 'controller';

const tripPlansRouter = Router();

tripPlansRouter.get('/:id', verifyToken, TripPlans.getTripPlan);
tripPlansRouter.put('/:id', verifyPayload, verifyToken, TripPlans.savePlan);

export default tripPlansRouter;
