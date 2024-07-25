import { getGreetingMessage } from './locales/greetingMessages';
import { getCalendarLinkMessage, getCalendarShareMessage } from './locales/calendarMessages';

interface Telegram {
	sendMessage: (
		chatId: number | string,
		text: string,
		parse_mode?: string,
		reply_to_message_id?: number
	) => Promise<any>;
}

interface App {
	telegram: Telegram;
	botName: string;
}

type LanguageTag = string; // e.g., 'en', 'es', 'fr', etc.

class MessageSender {
	private botName: string;
	private telegram: Telegram;
	private language: LanguageTag;

	constructor(app: App, telegram: Telegram, language: LanguageTag = 'en') {
		this.botName = app.botName;
		this.telegram = telegram;
		this.language = language;
	}

	setLanguage(language: LanguageTag): void {
		this.language = language;
	}

	async sendMessage(
		chatId: number | string,
		text: string,
		reply_to_message_id?: number
	): Promise<any> {
		return await this.telegram.sendMessage(chatId, text, 'MarkdownV2', reply_to_message_id);
	}

	async sendGreeting(chatId: number | string, replyToMessageId?: number): Promise<any> {
		const message = getGreetingMessage(this.language, this.botName);
		return await this.sendMessage(chatId, message, replyToMessageId);
	}

	async sendCalendarLink(
		chatId: number | string,
		userName: string,
		calendarRef: string
	): Promise<any> {
		const linkMessage = getCalendarLinkMessage(this.language);
		await this.sendMessage(chatId, linkMessage);
		const shareMessage = getCalendarShareMessage(
			this.language,
			userName,
			this.botName,
			calendarRef
		);
		return await this.sendMessage(chatId, shareMessage);
	}
}

export { MessageSender };
