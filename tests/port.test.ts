import app from 'app';
import { superdeno } from 'superdeno';

Deno.test({
	name: 'assigned port',
	fn: async () => {
		await superdeno(app)
			.get('/')
			.expect(200, 'Road trip API, you are probably not looking for us.');
	}
});
