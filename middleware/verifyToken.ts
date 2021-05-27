import 'loadEnv';
import { verify } from 'jwt';
import type { Response, NextFunction } from 'opine';

const verifyToken = async (
	req: { headers: Headers; user: unknown },
	res: Response,
	next: NextFunction
) => {
	const token = req.headers.get('x-auth-token');
	if (!token) return res.setStatus(401).json({ message: 'No token provided' });

	try {
		const payload = await verify(token, Deno.env.get('SECRET_KEY')!, 'HS512');
		req.user = payload;
		next();
	} catch (error) {
		next(error);
	}
};

export default verifyToken;
