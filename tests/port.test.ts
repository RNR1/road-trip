import app from 'app';
import { superdeno } from 'superdeno';

Deno.test({
	name: 'assigned port',
	fn: async () => {
		await superdeno(app)
			.get('/')
			.expect(
				200,
				'<h1>Road trip API, you are probably not looking for us.</h1>\n'
			);
	}
});
