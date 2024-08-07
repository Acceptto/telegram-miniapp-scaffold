import { Router, IRequest, RequestHandler } from 'itty-router';
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

type CFArgs = [Env, ExecutionContext];
const router = Router<IRequest, CFArgs>();

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
		let me: GetMe = await telegram.getMe();
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

		const incoming_data = (await request.json()) as IncomingInitData;

		if (typeof incoming_data.init_data_raw !== 'string') {
			throw new AppError(400, 'Invalid initDataRaw');
		}

		const { expected_hash, calculated_hash, data } = await telegram.calculateHashes(
			incoming_data.init_data_raw
		);

		console.log('Expected: ' + expected_hash);
		console.log('calculated: ' + calculated_hash);
		if (expected_hash !== calculated_hash) {
			throw new AppError(401, 'Unauthorized');
		}

		const current_time = Math.floor(Date.now() / 1000);
		if (current_time - data.data.auth_date > 600) {
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

		const token_hash = await sha256(token);
		//await db.saveToken(data.data.user.id, tokenHash);
		await db.saveUserAndToken(data.data.user, data.data.auth_date, token_hash);

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

		let supplied_token = request.headers.get('Authorization')?.replace('Bearer ', '');
		const token_hash = await sha256(supplied_token || '');
		let user: User | null = await db.getUserByTokenHash(token_hash);

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

		let supplied_token = request.headers.get('Authorization')?.replace('Bearer ', '');
		const token_hash = await sha256(supplied_token || '');
		let user: User | null = await db.getUserByTokenHash(token_hash);

		if (user === null) {
			throw new AppError(401, 'Unauthorized');
		}

		let ref = generateSecret(8);
		let json = (await request.json()) as DatesRequest;
		let dates = json.dates as string[];
		if (dates.length > 100) {
			throw new AppError(400, 'Too many dates');
		}
		for (const date of dates) {
			if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
				throw new AppError(400, 'Invalid date');
			}
		}

		let json_to_save = JSON.stringify({ dates: json.dates });

		await db.saveCalendar(json_to_save, ref, user.id);

		const language_code = user.language_code;

		let message_sender = new MessageSender(app, language_code);
		await message_sender.sendCalendarLink(user.telegram_id, user.first_name, ref);

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
		const telegram_provided_token = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
		const saved_token = await db.getSetting('telegram_security_code');

		if (telegram_provided_token !== saved_token) {
			throw new AppError(401, 'Unauthorized');
		}

		let message_json = await request.json();
		await processMessage(message_json as TelegramUpdate, app);

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
		let last_update_id = await db.getLatestUpdateId();
		let updates = await telegram.getUpdates(last_update_id);
		let results = [];
		for (const update of updates.result) {
			let result = await processMessage(update, app);
			results.push(result);
		}

		return new Response(
			`Success!
      Last update id:
      ${last_update_id}\n\n
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
		let external_url = json.externalUrl;

		let response = await telegram.setWebhook(`${external_url}/telegramMessage`, token);

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
