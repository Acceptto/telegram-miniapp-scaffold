import { D1Database, D1Result } from '@cloudflare/workers-types';
import { Setting, Message, User, Token, Calendar } from '@/types/dbTypes';
import { TelegramUser } from '@/types/types';

class Database {
	private db: D1Database;

	constructor(databaseConnection: D1Database) {
		this.db = databaseConnection;
	}

	private sanitizeValue(value: any): any {
		if (value === undefined) {
			return null;
		}
		if (typeof value === 'boolean') {
			return Number(value);
		}
		return value;
	}

	private sanitizeObject(
		obj: Record<string, any>,
		requiredFields: string[] = []
	): Record<string, any> {
		const sanitized: Record<string, any> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (requiredFields.includes(key) && (value === undefined || value === null)) {
				throw new Error(`Required field '${key}' cannot be null or undefined`);
			}
			sanitized[key] = this.sanitizeValue(value);
		}
		return sanitized;
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
		const sanitizedData = this.sanitizeObject({
			name: settingName,
			value: settingValue,
		});
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
			.bind(sanitizedData.name, sanitizedData.value)
			.run();
	}

	async addMessage(message: string, updateId: number): Promise<D1Result> {
		const sanitizedData = this.sanitizeObject({
			message,
			updateId,
		});
		return await this.db
			.prepare(
				`INSERT
      INTO messages (createdDate, updatedDate, message, updateId)
      VALUES (DATETIME('now'), DATETIME('now'), ?, ?)`
			)
			.bind(sanitizedData.message, sanitizedData.updateId)
			.run();
	}

	async getUser(telegramId: number): Promise<User | null> {
		if (!telegramId) {
			throw new Error('telegramId is required to get a user');
		}
		const result = await this.db
			.prepare('SELECT * FROM users WHERE telegramId = ?')
			.bind(telegramId)
			.first();
		return result as User | null;
	}

	async saveUser(user: TelegramUser, authTimestamp: number): Promise<D1Result> {
		console.log('Attempting to save user:', JSON.stringify(user, null, 2));
		if (!user.id) {
			throw new Error('telegram id is required to save a user');
		}

		const sanitizedUser = this.sanitizeObject(
			{
				lastAuthTimestamp: authTimestamp,
				telegramId: user.id,
				isBot: user.is_bot,
				firstName: user.first_name,
				lastName: user.last_name,
				username: user.username,
				languageCode: user.language_code,
				isPremium: user.is_premium,
				addedToAttachmentMenu: user.added_to_attachment_menu,
				allowsWriteToPm: user.allows_write_to_pm,
				photoUrl: user.photo_url,
			},
			['telegramId', 'lastAuthTimestamp', 'firstName']
		); // Specify required fields

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
				sanitizedUser.lastAuthTimestamp,
				sanitizedUser.telegramId,
				sanitizedUser.isBot,
				sanitizedUser.firstName,
				sanitizedUser.lastName,
				sanitizedUser.username,
				sanitizedUser.languageCode,
				sanitizedUser.isPremium,
				sanitizedUser.addedToAttachmentMenu,
				sanitizedUser.allowsWriteToPm,
				sanitizedUser.photoUrl
			)
			.run();
	}

	async saveToken(telegramId: number, tokenHash: Uint8Array): Promise<D1Result> {
		const user = await this.getUser(telegramId);
		if (!user) throw new Error('User not found');
		const sanitizedData = this.sanitizeObject({
			userId: user.id,
			tokenHash: tokenHash,
		});
		return await this.db
			.prepare(
				`INSERT
      INTO tokens (createdDate, updatedDate, expiredDate, userId, tokenHash)
      VALUES (DATETIME('now'), DATETIME('now'), DATETIME('now', '+1 day'), ?, ?)`
			)
			.bind(sanitizedData.userId, sanitizedData.tokenHash)
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
		const sanitizedData = this.sanitizeObject({
			calendarJson,
			calendarRef,
			userId,
		});
		return await this.db
			.prepare(
				`INSERT
      INTO calendars (createdDate, updatedDate, calendarJson, calendarRef, userId)
      VALUES (DATETIME('now'), DATETIME('now'), ?, ?, ?)`
			)
			.bind(sanitizedData.calendarJson, sanitizedData.calendarRef, sanitizedData.userId)
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
