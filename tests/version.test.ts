import { assert } from 'asserts';
Deno.test({
	name: 'checking deno version',
	fn(): void {
		const version: string = Deno.env.get('DENO_VERSION') ?? '0';
		assert(parseInt(version) >= 1);
	}
});
