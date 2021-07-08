import { Router } from 'opine';
import { verifyToken, verifyPayload } from 'middleware';
import { Notes } from 'controller';

const notesRouter = Router();

notesRouter.get('/', verifyToken, Notes.getNotes);
notesRouter.get('/:id', verifyToken, Notes.getNote);
notesRouter.post('/', verifyPayload, verifyToken, Notes.addNote);
notesRouter.patch('/:id', verifyPayload, verifyToken, Notes.updateNote);
notesRouter.delete('/:id', verifyToken, Notes.removeNote);

export default notesRouter;
