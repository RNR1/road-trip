import { RequestHandler } from 'opine';
import * as bcrypt from 'bcrypt';
import { isEmail } from 'isEmail';
import { create } from 'jwt';
import { User, users, Trip } from 'models';
import 'loadEnv';

export const signup: RequestHandler<
	Omit<User, '_id' | 'trips'>,
	{ message: string; token?: string; userId?: unknown }
> = async (req, res, next) => {
	try {
		const { firstName, lastName, email, password } = req.body;
		if (
			!firstName?.trim?.()?.length ||
			!lastName?.trim?.()?.length ||
			!isEmail(email) ||
			!password ||
			password?.length <= 5
		) {
			res.setStatus(403);
			throw new Error('Invalid credentials');
		}
		const hashedPassword = await bcrypt.hash(password);
		const userId = await users().insertOne({
			firstName,
			lastName,
			email: email.toLowerCase(),
			password: hashedPassword,
			trips: [] as Trip[]
		});
		if (!userId)
			return res
				.setStatus(500)
				.json({ message: 'Unexpected error while creating user' });
		const token = await create(
			{ alg: 'HS512', typ: 'JWT' },
			{ id: userId },
			'secret'
		);
		res.setStatus(201).json({
			message: 'User created successfully!',
			token,
			userId
		});
	} catch (error) {
		if (!(error.message as string).includes('E11000')) return next(error);
		res.setStatus(403);
		next(new Error('Email already exists'));
	}
};

export const login: RequestHandler<
	{ email: string; password: string },
	{ message: string; token?: string; userId?: string; email?: string },
	Record<string, unknown>
> = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const user = await users().findOne({ email }, { noCursorTimeout: false });
		if (!user)
			return res
				.setStatus(404)
				.json({ message: 'Could not connect with the provided credentials' });

		const isValid =
			Boolean(user.password) && (await bcrypt.compare(password, user.password));
		if (!isValid)
			return res
				.setStatus(403)
				.json({ message: 'Could not connect with the provided credentials' });

		const token = await create(
			{ alg: 'HS512', typ: 'JWT' },
			{ id: user._id.$oid, email: user.email },
			Deno.env.get('SECRET_KEY')!
		);
		res.setStatus(200).json({
			message: 'Login successful',
			token,
			userId: user._id.$oid,
			email: user.email
		});
	} catch (error) {
		next(error);
	}
};
