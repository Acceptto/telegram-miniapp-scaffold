import { Router, IRequest } from 'itty-router';
import { Telegram } from '@/telegram';
import { Database } from '@/db';
import { MessageSender } from '@/messageSender';
import { processMessage } from '@/messageProcessor';
import { generateSecret, sha256 } from '@/cryptoUtils';
import {
	App,
	Env,
	TelegramUpdate,
	User,
	GetMe,
	InitResponse,
	IncomingInitData,
	DatesRequest,
} from '@/types/types';
import { AppError, handleError } from './errorHandler';

// Define the type for additional arguments
type CFArgs = [Env, ExecutionContext, App];

// Update router initialization to use IRequest and CFArgs
const router = Router<IRequest, CFArgs>();

// Update handle function to use IRequest and pass app to router.handle
const handle = async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response> => {
	const telegram = new Telegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_USE_TEST_API);
	const db = new Database(env.D1_DATABASE);
	const cors_headers = {
		'Access-Control-Allow-Origin': env.FRONTEND_URL,
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400',
	};
	const is_localhost = request.headers.get('Host')?.match(/^(localhost|127\.0\.0\.1)/) !== null;
	let bot_name = await db.getSetting('bot_name');
	if (!bot_name) {
		const me: GetMe = await telegram.getMe();
		bot_name = me.result?.username ?? null;
		if (bot_name) {
			await db.setSetting('bot_name', bot_name);
		} else {
			console.error('Failed to get bot username');
		}
	}

	const app: App = { telegram, db, cors_headers, is_localhost, bot_name };

	return await router.handle(request, env, ctx, app);
};

// Separate handler functions for each route
const handleRoot = () => {
	return new Response(
		'This telegram bot is deployed correctly. No user-serviceable parts inside.',
		{ status: 200 }
	);
};

const handleMiniAppInit = async (request: IRequest, env: Env, ctx: ExecutionContext, app: App) => {
	try {
		const { telegram, db } = app;
		const incomingData = (await request.json()) as IncomingInitData;

		if (typeof incomingData.init_data_raw !== 'string') {
			throw new AppError(400, 'Invalid initDataRaw');
		}

		const { expected_hash, calculated_hash, data } = await telegram.calculateHashes(
			incomingData.init_data_raw
		);

		if (expected_hash !== calculated_hash) {
			throw new AppError(401, 'Unauthorized');
		}

		const currentTime = Math.floor(Date.now() / 1000);
		if (currentTime - data.data.auth_date > 600) {
			throw new AppError(400, 'Stale data, please restart the app');
		}

		if (!data.data.user || typeof data.data.user.id !== 'number') {
			throw new AppError(400, 'Invalid user data');
		}

		const token = generateSecret(16);
		if (!token) {
			throw new AppError(500, 'Failed to generate token');
		}

		const tokenHash = await sha256(token);
		await db.saveUserAndToken(data.data.user, data.data.auth_date, tokenHash);

		return new Response(
			JSON.stringify({
				token,
				start_param: data.data.start_param ?? null,
				start_page: data.data.start_param ? 'calendar' : 'home',
				user: await db.getUser(data.data.user.id),
			} satisfies InitResponse),
			{
				status: 200,
				headers: { ...app.cors_headers, 'Content-Type': 'application/json' },
			}
		);
	} catch (error: unknown) {
		return handleError(error);
	}
};

const handleMiniAppMe = async (request: IRequest, env: Env, ctx: ExecutionContext, app: App) => {
	try {
		const { db } = app;
		const suppliedToken = request.headers.get('Authorization')?.replace('Bearer ', '');
		const tokenHash = await sha256(suppliedToken || '');
		const user: User | null = await db.getUserByTokenHash(tokenHash);

		if (user === null) {
			throw new AppError(401, 'Unauthorized');
		}

		return new Response(JSON.stringify({ user }), {
			status: 200,
			headers: { ...app.cors_headers },
		});
	} catch (error: unknown) {
		return handleError(error);
	}
};

const handleMiniAppCalendar = async (
	request: IRequest,
	env: Env,
	ctx: ExecutionContext,
	app: App
) => {
	try {
		const { db } = app;
		const ref = (request as any).params.ref;
		const calendar = await db.getCalendarByRef(ref);

		if (calendar === null) {
			throw new AppError(404, 'Not found');
		}

		return new Response(JSON.stringify({ calendar: JSON.parse(calendar) }), {
			status: 200,
			headers: { ...app.cors_headers },
		});
	} catch (error: unknown) {
		return handleError(error);
	}
};

const handleMiniAppDates = async (request: IRequest, env: Env, ctx: ExecutionContext, app: App) => {
	try {
		const { db, bot_name } = app;
		const suppliedToken = request.headers.get('Authorization')?.replace('Bearer ', '');
		const tokenHash = await sha256(suppliedToken || '');
		const user: User | null = await db.getUserByTokenHash(tokenHash);

		if (user === null) {
			throw new AppError(401, 'Unauthorized');
		}

		const ref = generateSecret(8);
		const json = (await request.json()) as DatesRequest;
		const dates = json.dates as string[];
		if (dates.length > 100) {
			throw new AppError(400, 'Too many dates');
		}
		for (const date of dates) {
			if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
				throw new AppError(400, 'Invalid date');
			}
		}

		const jsonToSave = JSON.stringify({ dates: json.dates });
		await db.saveCalendar(jsonToSave, ref, user.id);

		const messageSender = new MessageSender(app, user.language_code);
		await messageSender.sendCalendarLink(user.telegram_id, user.first_name, ref);

		return new Response(JSON.stringify({ user }), {
			status: 200,
			headers: { ...app.cors_headers },
		});
	} catch (error: unknown) {
		return handleError(error);
	}
};

const handleTelegramMessage = async (
	request: IRequest,
	env: Env,
	ctx: ExecutionContext,
	app: App
) => {
	try {
		const { db } = app;
		const telegramProvidedToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
		const savedToken = await db.getSetting('telegram_security_code');

		if (telegramProvidedToken !== savedToken) {
			throw new AppError(401, 'Unauthorized');
		}

		const messageJson = await request.json();
		await processMessage(messageJson as TelegramUpdate, app);

		return new Response('Success', { status: 200 });
	} catch (error: unknown) {
		return handleError(error);
	}
};

const handleUpdateTelegramMessages = async (
	request: IRequest,
	env: Env,
	ctx: ExecutionContext,
	app: App
) => {
	try {
		if (!app.is_localhost) {
			throw new AppError(403, 'This request is only supposed to be used locally');
		}

		const { telegram, db } = app;
		const lastUpdateId = await db.getLatestUpdateId();
		const updates = await telegram.getUpdates(lastUpdateId);
		const results = [];
		for (const update of updates.result) {
			const result = await processMessage(update, app);
			results.push(result);
		}

		return new Response(
			`Success!
      Last update id:
      ${lastUpdateId}\n\n
      Updates:
      ${JSON.stringify(updates, null, 2)}\n\n
      Results:
      ${JSON.stringify(results, null, 2)}`,
			{ status: 200 }
		);
	} catch (error: unknown) {
		return handleError(error);
	}
};

const handleInit = async (request: IRequest, env: Env, ctx: ExecutionContext, app: App) => {
	try {
		if (request.headers.get('Authorization') !== `Bearer ${env.INIT_SECRET}`) {
			throw new AppError(401, 'Unauthorized');
		}

		const { telegram, db, bot_name } = app;
		let token = await db.getSetting('telegram_security_code');

		if (token === null) {
			token = crypto.getRandomValues(new Uint8Array(16)).join('');
			await db.setSetting('telegram_security_code', token);
		}

		const json = await request.json();
		if (!json || typeof json.externalUrl !== 'string') {
			throw new AppError(400, 'Invalid or missing externalUrl in request body');
		}

		const externalUrl = json.externalUrl;
		console.log(`Setting webhook to: ${externalUrl}/telegramMessage`);
		const response = await telegram.setWebhook(`${externalUrl}/telegramMessage`, token);

		if (!response.ok) {
			console.error('Webhook setting failed:', response);
			throw new AppError(500, 'Failed to set webhook');
		}

		console.log('Webhook set successfully:', response);

		return new Response(
			JSON.stringify({
				success: true,
				message: `Success! Bot Name: https://t.me/${bot_name}. Webhook status: ${JSON.stringify(response)}`,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error: unknown) {
		console.error('Error in /init endpoint:', error);
		if (error instanceof AppError) {
			return new Response(JSON.stringify({ success: false, error: error.message }), {
				status: error.statusCode,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		return new Response(JSON.stringify({ success: false, error: 'An unexpected error occurred' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

const handleCorsOptions = (request: IRequest, env: Env, ctx: ExecutionContext, app: App) =>
	new Response('Success', {
		headers: {
			...app.cors_headers,
		},
		status: 200,
	});

// routes
router.get('/', handleRoot);
router.post('/miniApp/init', handleMiniAppInit);
router.get('/miniApp/me', handleMiniAppMe);
router.get('/miniApp/calendar/:ref', handleMiniAppCalendar);
router.post('/miniApp/dates', handleMiniAppDates);
router.post('/telegramMessage', handleTelegramMessage);
router.get('/updateTelegramMessages', handleUpdateTelegramMessages);
router.post('/init', handleInit);
router.options('/miniApp/*', handleCorsOptions);
router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: handle,
};
