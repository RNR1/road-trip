import 'loadEnv';
import { verify } from 'jwt';
import type { Request, Response, NextFunction } from 'opine';

export interface TokenRequest extends Request {
	user?: Record<string, unknown>;
	body: Record<string, unknown>;
	query: Record<string, unknown>;
	params: Record<string, string>;
}

const verifyToken = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
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
		req.user = payload;
		next();
	} catch (error) {
		next(error);
	}
};

export default verifyToken;
