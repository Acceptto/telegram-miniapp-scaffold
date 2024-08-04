import { D1Database, D1Result } from '@cloudflare/workers-types';
import { Setting, Message, User, Token, Calendar } from '@/types/dbTypes';

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
				`INSERT
        INTO settings (createdDate, updatedDate, name, value)
        VALUES (DATETIME('now'), DATETIME('now'), ?, ?)
        ON CONFLICT(name) DO UPDATE SET
          updatedDate = DATETIME('now'),
          value = excluded.value
          WHERE excluded.value <> settings.value`
			)
			.bind(settingName, settingValue)
			.run();
	}

	async addMessage(message: string, updateId: number): Promise<D1Result> {
		return await this.db
			.prepare(
				`INSERT
        INTO messages (createdDate, updatedDate, message, updateId)
        VALUES (DATETIME('now'), DATETIME('now'), ?, ?)`
			)
			.bind(message, updateId)
			.run();
	}

	async getUser(telegramId: number): Promise<User | null> {
		const result = await this.db
			.prepare('SELECT * FROM users WHERE telegramId = ?')
			.bind(telegramId)
			.first();
		return result as User | null;
	}

	async saveUser(user: Partial<User>, authTimestamp: number): Promise<D1Result> {
		return await this.db
			.prepare(
				`INSERT
        INTO users (createdDate, updatedDate, lastAuthTimestamp,
          telegramId, isBot, firstName, lastName, username, languageCode,
          isPremium, addedToAttachmentMenu, allowsWriteToPm, photoUrl
          )
        VALUES (DATETIME('now'), DATETIME('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(telegramId) DO UPDATE SET
          updatedDate = DATETIME('now'),
          lastAuthTimestamp = COALESCE(excluded.lastAuthTimestamp, lastAuthTimestamp),
          isBot = COALESCE(excluded.isBot, isBot),
          firstName = excluded.firstName,
          lastName = excluded.lastName,
          username = excluded.username,
          languageCode = COALESCE(excluded.languageCode, languageCode),
          isPremium = COALESCE(excluded.isPremium, isPremium),
          addedToAttachmentMenu = COALESCE(excluded.addedToAttachmentMenu, addedToAttachmentMenu),
          allowsWriteToPm = COALESCE(excluded.allowsWriteToPm, allowsWriteToPm),
          photoUrl = COALESCE(excluded.photoUrl, photoUrl)
          WHERE excluded.lastAuthTimestamp > users.lastAuthTimestamp`
			)
			.bind(
				authTimestamp,
				user.telegramId,
				Number(user.isBot),
				user.firstName || null,
				user.lastName || null,
				user.username || null,
				user.languageCode || null,
				Number(user.isPremium),
				Number(user.addedToAttachmentMenu),
				Number(user.allowsWriteToPm),
				user.photoUrl || null
			)
			.run();
	}

	async saveToken(telegramId: number, tokenHash: Uint8Array): Promise<D1Result> {
		const user = await this.getUser(telegramId);
		if (!user) throw new Error('User not found');
		return await this.db
			.prepare(
				`INSERT
        INTO tokens (createdDate, updatedDate, expiredDate, userId, tokenHash)
        VALUES (DATETIME('now'), DATETIME('now'), DATETIME('now', '+1 day'), ?, ?)`
			)
			.bind(user.id, tokenHash)
			.run();
	}

	async getUserByTokenHash(tokenHash: Uint8Array): Promise<User | null> {
		return await this.db
			.prepare(
				`SELECT users.* FROM tokens
        INNER JOIN users ON tokens.userId = users.id
        WHERE tokenHash = ? AND DATETIME('now') < expiredDate`
			)
			.bind(tokenHash)
			.first();
	}

	async saveCalendar(calendarJson: string, calendarRef: string, userId: number): Promise<D1Result> {
		return await this.db
			.prepare(
				`INSERT
        INTO calendars (createdDate, updatedDate, calendarJson, calendarRef, userId)
        VALUES (DATETIME('now'), DATETIME('now'), ?, ?, ?)`
			)
			.bind(calendarJson, calendarRef, userId)
			.run();
	}

	async getCalendarByRef(calendarRef: string): Promise<string | null> {
		return await this.db
			.prepare(
				`SELECT calendarJson FROM calendars
        WHERE calendarRef = ?`
			)
			.bind(calendarRef)
			.first('calendarJson');
	}
}

export { Database };
