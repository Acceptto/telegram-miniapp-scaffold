import { Router } from 'itty-router';
import { Telegram } from './telegram';
import { Database } from './db';
import { processMessage } from './messageProcessor';
import { MessageSender } from './messageSender';
import { generateSecret, sha256 } from './cryptoUtils';

interface Env {
	TELEGRAM_BOT_TOKEN: string;
	TELEGRAM_USE_TEST_API: boolean;
	DB: any;
	FRONTEND_URL: string;
	INIT_SECRET: string;
}

interface App {
	telegram: Telegram;
	db: Database;
	corsHeaders: Record<string, string>;
	isLocalhost: boolean;
	botName: string | null;
}

// Create a new router
const router = Router();

const handle = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
	let telegram = new Telegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_USE_TEST_API);
	let db = new Database(env.DB);
	let corsHeaders = {
		'Access-Control-Allow-Origin': env.FRONTEND_URL,
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400',
	};
	let isLocalhost = request.headers.get('Host')?.match(/^(localhost|127\.0\.0\.1)/) !== null;
	let botName = await db.getSetting('bot_name');
	if (!botName) {
		let me = await telegram.getMe();
		botName = me.result.username;
		if (botName) {
			// Check if username is not null or undefined
			await db.setSetting('bot_name', botName);
		} else {
			// Handle the case where we couldn't get a valid botName
			console.error('Failed to get bot username');
			botName = null; // or set a default value
		}
	}

	let app: App = { telegram, db, corsHeaders, isLocalhost, botName };

	return await router.handle(request, app, env, ctx);
};

router.get('/', () => {
	return new Response(
		'This telegram bot is deployed correctly. No user-serviceable parts inside.',
		{ status: 200 }
	);
});

router.post('/miniApp/init', async (request: Request, app: App) => {
	const { telegram, db } = app;
	let json = await request.json();
	let initData = json.initData;

	let { expectedHash, calculatedHash, data } = await telegram.calculateHashes(initData);

	if (expectedHash !== calculatedHash) {
		return new Response('Unauthorized', { status: 401, headers: { ...app.corsHeaders } });
	}

	const currentTime = Math.floor(Date.now() / 1000);
	let stalenessSeconds = currentTime - data.auth_date;
	if (stalenessSeconds > 600) {
		return new Response('Stale data, please restart the app', {
			status: 400,
			headers: { ...app.corsHeaders },
		});
	}

	await db.saveUser(data.user, data.auth_date);
	const token = generateSecret(16);
	if (token) {
		const tokenHash = await sha256(token);
		await db.saveToken(data.user.id, tokenHash);

		return new Response(
			JSON.stringify({
				token: token,
				startParam: data.start_param,
				startPage: data.start_param ? 'calendar' : 'home',
				user: await db.getUser(data.user.id),
			}),
			{ status: 200, headers: { ...app.corsHeaders } }
		);
	} else {
		return new Response('Failed to generate token', {
			status: 500,
			headers: { ...app.corsHeaders },
		});
	}
});

router.get('/miniApp/me', async (request: Request, app: App) => {
	const { db } = app;

	let suppliedToken = request.headers.get('Authorization')?.replace('Bearer ', '');
	const tokenHash = await sha256(suppliedToken || '');
	let user = await db.getUserByTokenHash(tokenHash);

	if (user === null) {
		return new Response('Unauthorized', { status: 401 });
	}

	return new Response(JSON.stringify({ user: user }), {
		status: 200,
		headers: { ...app.corsHeaders },
	});
});

router.get('/miniApp/calendar/:ref', async (request: Request, app: App) => {
	const { db } = app;

	let ref = (request as any).params.ref;
	let calendar = await db.getCalendarByRef(ref);

	if (calendar === null) {
		return new Response('Not found', { status: 404 });
	}

	return new Response(JSON.stringify({ calendar: JSON.parse(calendar) }), {
		status: 200,
		headers: { ...app.corsHeaders },
	});
});

router.post('/miniApp/dates', async (request: Request, app: App) => {
	const { db, telegram, botName } = app;

	let suppliedToken = request.headers.get('Authorization')?.replace('Bearer ', '');
	const tokenHash = await sha256(suppliedToken || '');
	let user = await db.getUserByTokenHash(tokenHash);

	if (user === null) {
		return new Response('Unauthorized', { status: 401 });
	}

	let ref = generateSecret(8);
	let json = await request.json();
	let dates = json.dates as string[];
	if (dates.length > 100) {
		return new Response('Too many dates', { status: 400 });
	}
	for (const date of dates) {
		if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
			return new Response('Invalid date', { status: 400 });
		}
	}

	let jsonToSave = JSON.stringify({ dates: json.dates });
	await db.saveCalendar(jsonToSave, ref, user.id);

	let messageSender = new MessageSender(app, telegram);
	await messageSender.sendCalendarLink(user.telegramId, user.firstName, ref);

	return new Response(JSON.stringify({ user: user }), {
		status: 200,
		headers: { ...app.corsHeaders },
	});
});

router.post('/telegramMessage', async (request: Request, app: App) => {
	const { db } = app;
	const telegramProvidedToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
	const savedToken = await db.getSetting('telegram_security_code');

	if (telegramProvidedToken !== savedToken) {
		return new Response('Unauthorized', { status: 401 });
	}

	let messageJson = await request.json();
	await processMessage(messageJson, app);

	return new Response('Success', { status: 200 });
});

router.get('/updateTelegramMessages', async (request: Request, app: App, env: Env) => {
	if (!app.isLocalhost) {
		return new Response('This request is only supposed to be used locally', { status: 403 });
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
});

router.post('/init', async (request: Request, app: App, env: Env) => {
	if (request.headers.get('Authorization') !== `Bearer ${env.INIT_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { telegram, db, botName } = app;

	let token = await db.getSetting('telegram_security_code');

	if (token === null) {
		token = crypto.getRandomValues(new Uint8Array(16)).join('');
		await db.setSetting('telegram_security_code', token);
	}

	let json = await request.json();
	let externalUrl = json.externalUrl;

	let response = await telegram.setWebhook(`${externalUrl}/telegramMessage`, token);

	return new Response(
		`Success! Bot Name: https://t.me/${botName}. Webhook status:  ${JSON.stringify(response)}`,
		{ status: 200 }
	);
});

router.options(
	'/miniApp/*',
	(request: Request, app: App, env: Env) =>
		new Response('Success', {
			headers: {
				...app.corsHeaders,
			},
			status: 200,
		})
);

router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: handle,
};
