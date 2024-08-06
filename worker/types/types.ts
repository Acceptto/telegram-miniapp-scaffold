import { Database } from '@/db';
import { Telegram } from '@/telegram';
import type * as dbTypes from '@/types/dbTypes';
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

export interface IncomingInitData {
	initDataRaw: string;
}

export interface TelegramUser {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
	is_premium?: boolean;
	added_to_attachment_menu?: boolean;
	allows_write_to_pm?: boolean;
	photo_url?: string | null;
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

export interface getMe {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
	is_premium?: boolean;
	added_to_attachment_menu?: boolean;
	can_join_groups?: boolean;
	can_read_all_group_messages?: boolean;
	supports_inline_queries?: boolean;
	can_connect_to_business?: boolean;
	has_main_web_app?: boolean;
}

export interface Chat {
	id: number;
	phot_url?: string;
	type?: 'group' | 'supergroup' | 'channel' | string;
	title?: string;
	username?: string;
}

export interface CalculateHashesResult {
	expected_hash: string;
	calculated_hash: string;
	data: {
		auth_date: number;
		chat_instance?: number;
		chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel' | string;
		receiver?: TelegramUser;
		chat?: Chat;
		start_param?: string | null;
		can_send_after?: number;
		query_id?: string;
		user?: TelegramUser;
	};
}

export interface InitResponse {
	token: string;
	start_param?: string | null;
	start_page: 'calendar' | 'home';
	user: dbTypes.User | null;
}

export type LanguageTag = string | null;
