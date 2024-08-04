import { getGreetingMessage } from '@/locales/greetingMessages';
import { getCalendarLinkMessage, getCalendarShareMessage } from '@/locales/calendarMessages';
import { Telegram } from '@/telegram';
import { App, LanguageTag } from '@/types/types';

class MessageSender {
	private botName: string;
	private telegram: Telegram;
	private language: LanguageTag;

	constructor(app: App, language: LanguageTag = 'en') {
		this.botName = app.botName ?? '';
		this.telegram = app.telegram;
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
		userName: string | null,
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
