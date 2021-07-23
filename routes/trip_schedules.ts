import { Router } from 'opine';
import { verifyToken } from 'middleware';
import { TripSchedules } from 'controller';

const tripSchedulesRouter = Router();

tripSchedulesRouter.get('/:id', verifyToken, TripSchedules.getTripSchedule);

export default tripSchedulesRouter;
