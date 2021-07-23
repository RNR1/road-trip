import { Router } from 'opine';
import { verifyToken, verifyPayload } from 'middleware';
import { ScheduledEvents } from 'controller';

const scheduledEventsRouter = Router();

scheduledEventsRouter.get(
	'/:id',
	verifyToken,
	ScheduledEvents.getScheduledEvent
);
scheduledEventsRouter.post(
	'/',
	verifyPayload,
	verifyToken,
	ScheduledEvents.addEvent
);
scheduledEventsRouter.put(
	'/:id',
	verifyPayload,
	verifyToken,
	ScheduledEvents.updateEvent
);

export default scheduledEventsRouter;
