import { D1Database, D1Result } from '@cloudflare/workers-types';
import { Setting, Message, User, Token, Calendar } from '@/types/dbTypes';
import { TelegramUser } from '@/types/types';

class Database {
	private db: D1Database;

	constructor(databaseConnection: D1Database) {
		this.db = databaseConnection;
	}

	async getSetting(settingName: string): Promise<string | null> {
		return await this.db
			.prepare('SELECT value FROM settings WHERE name = ?')
			.bind(settingName)
			.first('value');
	}

	async getLatestUpdateId(): Promise<number> {
		const result = await this.db
			.prepare('SELECT updateId FROM messages ORDER BY updateId DESC LIMIT 1')
			.first('updateId');

		return Number(result ?? 0);
	}

	async setSetting(settingName: string, settingValue: string): Promise<D1Result> {
		return await this.db
			.prepare(
				`
        INSERT INTO settings (created_date, updated_date, name, value)
        VALUES (DATETIME('now'), DATETIME('now'), ?, ?)
        ON CONFLICT(name) DO UPDATE SET
          updated_date = DATETIME('now'),
          value = excluded.value
        WHERE excluded.value <> settings.value
      `
			)
			.bind(settingName, settingValue)
			.run();
	}

	async addMessage(message: string, updateId: number): Promise<D1Result> {
		return await this.db
			.prepare(
				`
        INSERT INTO messages (created_date, updated_date, message, update_id)
        VALUES (DATETIME('now'), DATETIME('now'), ?, ?)
      `
			)
			.bind(message, updateId)
			.run();
	}

	async getUser(telegram_id: number): Promise<User | null> {
		if (!telegram_id) {
			throw new Error('telegram_id is required to get a user');
		}
		return await this.db
			.prepare('SELECT * FROM users WHERE telegram_id = ?')
			.bind(telegram_id)
			.first();
	}

	async saveUser(user: TelegramUser, auth_timestamp: number): Promise<D1Result> {
		if (!user.id) {
			throw new Error('Telegram ID is required to save a user');
		}

		const userData = {
			last_auth_timestamp: auth_timestamp,
			telegram_id: user.id,
			is_bot: Number(user.is_bot),
			first_name: user.first_name || null,
			last_name: user.last_name || null,
			username: user.username || null,
			language_code: user.language_code || null,
			is_premium: Number(user.is_premium),
			added_to_attachment_menu: Number(user.added_to_attachment_menu),
			allows_write_to_pm: Number(user.allows_write_to_pm),
			photo_url: user.photo_url || null,
		};

		const fields = Object.keys(userData).join(', ');
		const placeholders = Object.keys(userData)
			.map(() => '?')
			.join(', ');
		const updates = Object.keys(userData)
			.map(key => `${key} = COALESCE(excluded.${key}, ${key})`)
			.join(', ');

		const query = `
      INSERT INTO users (created_date, updated_date, ${fields})
      VALUES (DATETIME('now'), DATETIME('now'), ${placeholders})
      ON CONFLICT(telegram_id) DO UPDATE SET
        updated_date = DATETIME('now'),
        ${updates}
      WHERE excluded.last_auth_timestamp > users.last_auth_timestamp
    `;

		try {
			return await this.db
				.prepare(query)
				.bind(...Object.values(userData))
				.run();
		} catch (error) {
			console.error('Error saving user:', error);
			throw new Error('Failed to save user data');
		}
	}

	async saveToken(telegramId: number, tokenHash: Uint8Array): Promise<D1Result> {
		const user = await this.getUser(telegramId);
		if (!user) throw new Error('User not found');
		return await this.db
			.prepare(
				`
        INSERT INTO tokens (created_date, updated_date, expired_date, user_id, token_hash)
        VALUES (DATETIME('now'), DATETIME('now'), DATETIME('now', '+1 day'), ?, ?)
      `
			)
			.bind(user.id, tokenHash)
			.run();
	}

	async getUserByTokenHash(tokenHash: Uint8Array): Promise<User | null> {
		return await this.db
			.prepare(
				`
      SELECT u.*
      FROM users u
      JOIN tokens t ON u.id = t.user_id
      WHERE t.token_hash = ? AND t.expired_date > DATETIME('now')
      LIMIT 1
    `
			)
			.bind(tokenHash)
			.first();
	}

	async saveCalendar(calendarJson: string, calendarRef: string, userId: number): Promise<D1Result> {
		return await this.db
			.prepare(
				`
        INSERT INTO calendars (created_date, updated_date, calendar_json, calendar_ref, user_id)
        VALUES (DATETIME('now'), DATETIME('now'), ?, ?, ?)
      `
			)
			.bind(calendarJson, calendarRef, userId)
			.run();
	}

	async getCalendarByRef(calendarRef: string): Promise<string | null> {
		return await this.db
			.prepare('SELECT calendar_json FROM calendars WHERE calendar_ref = ?')
			.bind(calendarRef)
			.first('calendar_json');
	}

	async saveUserAndToken(
		user: TelegramUser,
		auth_timestamp: number,
		tokenHash: Uint8Array
	): Promise<void> {
		await this.db.batch([
			this.db.prepare('BEGIN'),
			this.db
				.prepare(
					`
      INSERT INTO users (created_date, updated_date, last_auth_timestamp, telegram_id, is_bot, first_name, last_name, username, language_code, is_premium, added_to_attachment_menu, allows_write_to_pm, photo_url)
      VALUES (DATETIME('now'), DATETIME('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        updated_date = DATETIME('now'),
        last_auth_timestamp = COALESCE(excluded.last_auth_timestamp, last_auth_timestamp),
        is_bot = COALESCE(excluded.is_bot, is_bot),
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        username = excluded.username,
        language_code = COALESCE(excluded.language_code, language_code),
        is_premium = COALESCE(excluded.is_premium, is_premium),
        added_to_attachment_menu = COALESCE(excluded.added_to_attachment_menu, added_to_attachment_menu),
        allows_write_to_pm = COALESCE(excluded.allows_write_to_pm, allows_write_to_pm),
        photo_url = COALESCE(excluded.photo_url, photo_url)
      WHERE excluded.last_auth_timestamp > users.last_auth_timestamp
    `
				)
				.bind(
					auth_timestamp,
					user.id,
					Number(user.is_bot),
					user.first_name || null,
					user.last_name || null,
					user.username || null,
					user.language_code || null,
					Number(user.is_premium),
					Number(user.added_to_attachment_menu),
					Number(user.allows_write_to_pm),
					user.photo_url || null
				),
			this.db
				.prepare(
					`
      INSERT INTO tokens (created_date, updated_date, expired_date, user_id, token_hash)
      VALUES (DATETIME('now'), DATETIME('now'), DATETIME('now', '+1 day'), (SELECT id FROM users WHERE telegram_id = ?), ?)
    `
				)
				.bind(user.id, tokenHash),
			this.db.prepare('COMMIT'),
		]);
	}
}

export { Database };
