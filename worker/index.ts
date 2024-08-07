import { Router } from 'itty-router';
import { Telegram } from '@/telegram';
import { Database } from '@/db';
import { processMessage } from '@/messageProcessor';
import { MessageSender } from '@/messageSender';
import { generateSecret, sha256 } from '@/cryptoUtils';
import {
	App,
	Env,
	TelegramUpdate,
	User,
	GetMe,
	InitResponse,
	CalculateHashesResult,
	IncomingInitData,
} from '@/types/types';
import { AppError, handleError } from './errorHandler';

// Create a new router
const router = Router();

const handle = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	let telegram: Telegram = new Telegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_USE_TEST_API);
	let db: Database = new Database(env.D1_DATABASE);
	let cors_headers: Record<string, string> = {
		'Access-Control-Allow-Origin': env.FRONTEND_URL,
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400',
	};
	let is_localhost: boolean =
		request.headers.get('Host')?.match(/^(localhost|127\.0\.0\.1)/) !== null;
	let bot_name: string | null = await db.getSetting('bot_name');
	if (!bot_name) {
		let me: GetMe | null = await telegram.getMe();
		bot_name = me.result?.username ?? null;
		if (bot_name) {
			await db.setSetting('bot_name', bot_name);
		} else {
			console.error('Failed to get bot username');
		}
	}

	let app: App = { telegram, db, cors_headers, is_localhost, bot_name };

	return await router.handle(request, app, env, ctx);
};

router.get('/', () => {
	return new Response(
		'This telegram bot is deployed correctly. No user-serviceable parts inside.',
		{ status: 200 }
	);
});

router.post('/miniApp/init', async (request: Request, app: App) => {
	try {
		const { telegram, db }: { telegram: Telegram; db: Database } = app;

		const incomingData = (await request.json()) as IncomingInitData;

		if (typeof incomingData.init_data_raw !== 'string') {
			throw new AppError(400, 'Invalid initDataRaw');
		}

		const { expected_hash, calculated_hash, data } = await telegram.calculateHashes(
			incomingData.init_data_raw
		);

		console.log('Expected: ' + expected_hash);
		console.log('calculated: ' + calculated_hash);
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

		//await db.saveUser(data.data.user, data.data.auth_date);
		const token = generateSecret(16);
		if (!token) {
			throw new AppError(500, 'Failed to generate token');
		}

		const tokenHash = await sha256(token);
		//await db.saveToken(data.data.user.id, tokenHash);
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
});

router.get('/miniApp/me', async (request: Request, app: App) => {
	try {
		const { db } = app;

		let suppliedToken = request.headers.get('Authorization')?.replace('Bearer ', '');
		const tokenHash = await sha256(suppliedToken || '');
		let user: User | null = await db.getUserByTokenHash(tokenHash);

		if (user === null) {
			throw new AppError(401, 'Unauthorized');
		}

		return new Response(JSON.stringify({ user: user }), {
			status: 200,
			headers: { ...app.cors_headers },
		});
	} catch (error: unknown) {
		return handleError(error);
	}
});

router.get('/miniApp/calendar/:ref', async (request: Request, app: App) => {
	try {
		const { db } = app;

		let ref = (request as any).params.ref;
		let calendar = await db.getCalendarByRef(ref);

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
});

router.post('/miniApp/dates', async (request: Request, app: App) => {
	try {
		const { db, telegram, bot_name } = app;

		let suppliedToken = request.headers.get('Authorization')?.replace('Bearer ', '');
		const tokenHash = await sha256(suppliedToken || '');
		let user = await db.getUserByTokenHash(tokenHash);

		if (user === null) {
			throw new AppError(401, 'Unauthorized');
		}

		let ref = generateSecret(8);
		let json = (await request.json()) as any;
		let dates = json.dates as string[];
		if (dates.length > 100) {
			throw new AppError(400, 'Too many dates');
		}
		for (const date of dates) {
			if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
				throw new AppError(400, 'Invalid date');
			}
		}

		let jsonToSave = JSON.stringify({ dates: json.dates });
		await db.saveCalendar(jsonToSave, ref, user.id);

		const languageCode = user.language_code;

		let messageSender = new MessageSender(app, languageCode);
		await messageSender.sendCalendarLink(user.telegram_id, user.first_name, ref);

		return new Response(JSON.stringify({ user: user }), {
			status: 200,
			headers: { ...app.cors_headers },
		});
	} catch (error: unknown) {
		return handleError(error);
	}
});

router.post('/telegramMessage', async (request: Request, app: App) => {
	try {
		const { db } = app;
		const telegramProvidedToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
		const savedToken = await db.getSetting('telegram_security_code');

		if (telegramProvidedToken !== savedToken) {
			throw new AppError(401, 'Unauthorized');
		}

		let messageJson = await request.json();
		await processMessage(messageJson as TelegramUpdate, app);

		return new Response('Success', { status: 200 });
	} catch (error: unknown) {
		return handleError(error);
	}
});

router.get('/updateTelegramMessages', async (request: Request, app: App, env: Env) => {
	try {
		if (!app.is_localhost) {
			throw new AppError(403, 'This request is only supposed to be used locally');
		}

		const { telegram, db } = app;
		let lastUpdateId = await db.getLatestUpdateId();
		let updates = await telegram.getUpdates(lastUpdateId);
		let results = [];
		for (const update of updates.result) {
			let result = await processMessage(update, app);
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
});

router.post('/init', async (request: Request, app: App, env: Env) => {
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

		let json = (await request.json()) as any;
		let externalUrl = json.externalUrl;

		let response = await telegram.setWebhook(`${externalUrl}/telegramMessage`, token);

		return new Response(
			`Success! Bot Name: https://t.me/${bot_name}. Webhook status:  ${JSON.stringify(response)}`,
			{ status: 200 }
		);
	} catch (error: unknown) {
		return handleError(error);
	}
});

router.options(
	'/miniApp/*',
	(request: Request, app: App, env: Env) =>
		new Response('Success', {
			headers: {
				...app.cors_headers,
			},
			status: 200,
		})
);

router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: handle,
};
