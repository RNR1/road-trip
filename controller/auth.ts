import * as bcrypt from 'bcrypt';
import { uploadImage } from 'cloudinary';
import { WEEK } from 'datetime';
import { getId } from 'db';
import { sendMail } from 'emails';
import { isEmail } from 'isEmail';
import { create } from 'jwt';
import { TokenRequest } from 'middleware';
import { AuthResponse, User, users } from 'models';
import { RequestHandler, Response, NextFunction } from 'opine';
import type { UploadAPIResponse } from 'types/cloudinary';
import 'loadEnv';

export const signup: RequestHandler<Omit<User, '_id'>, AuthResponse> = async (
	req,
	res,
	next
) => {
	try {
		const { firstName, lastName, email, password, avatar } = req.body;

		if (
			!firstName?.trim?.()?.length ||
			!lastName?.trim?.()?.length ||
			!isEmail(email) ||
			!password ||
			password?.length <= 5
		) {
			res.setStatus(403);
			throw new Error(
				"Yikes, something here doesn't look right, please try again"
			);
		}

		let asset: UploadAPIResponse;
		if (Boolean(avatar) && typeof avatar !== 'string') {
			res.setStatus(400);
			throw new Error('Invalid avatar');
		} else {
			asset = await uploadImage(avatar);
			if (asset.error) throw new Error('We had a problem with your avatar');
		}
		const hashedPassword = await bcrypt.hash(password);
		const userId = await users()?.insertOne({
			avatar: asset.error ? undefined : asset.eager[0]?.url,
			firstName,
			lastName,
			email: email.toLowerCase(),
			password: hashedPassword,
			createdAt: new Date().toISOString()
		});
		if (!userId) {
			res.setStatus(500);
			throw new Error(
				"Yikes, something here doesn't look right, please try again"
			);
		}
		const token = await create(
			{ alg: 'HS512', typ: 'JWT' },
			{
				id: userId,
				email,
				firstName,
				lastName,
				avatar: asset.eager[0].url,
				exp: WEEK
			},
			Deno.env.get('SECRET_KEY')!
		);

		res.setStatus(201).json({
			message: 'Your account was successfully created!',
			token,
			id: userId.toString(),
			avatar: asset.url,
			email: email.toLowerCase(),
			firstName,
			lastName
		});
		sendMail({
			to: email,
			subject: 'Welcome to On the Road!',
			content:
				"<h1>Welcome aboard!</h1><p>We're happy to have you here, <br> Visit us at: https://road-trip-client.vercel.app/</p>"
		});
		next();
	} catch (error) {
		if (!(error.message as string).includes('E11000')) return next(error);
		res.setStatus(403);
		next(
			new Error(
				"There's already an account with this email address. Did you mean to log in?"
			)
		);
	}
};

export const login: RequestHandler<
	{ email: string; password: string },
	AuthResponse,
	Record<string, unknown>
> = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const user: User | undefined = await users()?.findOne(
			{ email },
			{ noCursorTimeout: false }
		);
		if (!user) {
			res.setStatus(404);
			throw new Error("Yikes, something's not right, please try again");
		}

		const isValid =
			Boolean(user.password) && (await bcrypt.compare(password, user.password));
		if (!isValid) {
			res.setStatus(403);
			throw new Error("Yikes, something's not right, please try again");
		}

		const token = await create(
			{ alg: 'HS512', typ: 'JWT' },
			{
				id: getId(user._id),
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				avatar: user.avatar,
				exp: WEEK
			},
			Deno.env.get('SECRET_KEY')!
		);

		const { password: _, _id, ...rest } = user;
		res.setStatus(200).json({
			message: "You're all set!",
			token,
			...rest,
			id: getId(_id)
		});
		next();
	} catch (error) {
		next(error);
	}
};

export const returnToken = async (
	req: TokenRequest,
	res: Response,
	next: NextFunction
) => {
	const user = await users()?.findOne(
		{ _id: req.user?.id },
		{
			noCursorTimeout: false,
			projection: { _id: 0, createdAt: 0, password: 0 }
		}
	);
	if (!user) {
		res.setStatus(401);
		return next(new Error("Yikes, something's not right, please try again"));
	}
	res.setStatus(200).json({ ...req.user, ...user });
	next();
};
