import 'loadEnv';
import { verify } from 'jwt';
import type { Request, Response, NextFunction } from 'opine';

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers.get('Authorization');

	if (!token) {
		res.setStatus(401);
		throw new Error('No token has provided');
	}
	try {
		const payload = await verify(
			token.replace('Bearer ', ''),
			Deno.env.get('SECRET_KEY')!,
			'HS512'
		);
		(
			req as unknown as { headers: Headers; user: Record<string, unknown> }
		).user = payload;
		next();
	} catch (error) {
		next(error);
	}
};

export default verifyToken;
