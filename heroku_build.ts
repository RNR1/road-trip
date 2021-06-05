const process = Deno.run({
	env: { PUPPETEER_PRODUCT: 'chrome' },
	cmd: [
		Deno.execPath(),
		'run',
		'-A',
		'--unstable',
		'https://deno.land/x/puppeteer@9.0.1/install.ts'
	],
	stdout: 'piped',
	stderr: 'piped'
});

const decoder = new TextDecoder();

const [status, stdout, stderr] = await Promise.all([
	process.status(),
	process.output(),
	process.stderrOutput()
]);
process.close();

console.log(`STATUS: ${status.code} SUCCESS: ${status.success}`);
console.log(`STDOUT: ${decoder.decode(stdout)}`);
console.log(`STDERR: ${decoder.decode(stderr)}`);
