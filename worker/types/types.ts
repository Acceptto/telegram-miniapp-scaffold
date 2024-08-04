import { Database } from '@/db';
import { Telegram } from '@/telegram';
export * from '@/types/dbTypes';

export interface App {
	telegram: Telegram;
	db: Database;
	corsHeaders: Record<string, string>;
	isLocalhost: boolean;
	botName: string | null;
}

export interface Env {
	/** Telegram Bot Token. Must be kept secret. */
	TELEGRAM_BOT_TOKEN: string;

	/** Whether to use Telegram's test API. Optional. */
	TELEGRAM_USE_TEST_API?: boolean;

	/** D1 database binding */
	D1_DATABASE: D1Database;

	/** URL of the frontend application */
	FRONTEND_URL: string;

	/** Secret used for initialization. Must be kept secret. */
	INIT_SECRET: string;
}

export interface TelegramMessage {
	chat: {
		id: number;
	};
	message_id: number;
	text?: string;
	from?: {
		language_code?: string;
	};
}

export interface TelegramUpdate {
	message: TelegramMessage;
	update_id: number;
}

export type LanguageTag = string | null;
