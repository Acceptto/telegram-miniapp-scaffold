import { MessageSender } from './messageSender';

// Define interfaces
interface TelegramMessage {
	chat: {
		id: number;
	};
	message_id: number;
	text?: string;
}

interface TelegramUpdate {
	message: TelegramMessage;
	update_id: number;
}

interface Database {
	addMessage: (message: string, updateId: number) => Promise<void>;
}

interface Telegram {
	calculateHashes: (initData: string) => Promise<{
		expectedHash: string;
		calculatedHash: string;
		data: Record<string, any>;
	}>;
	getUpdates: (lastUpdateId?: number) => Promise<any>;
	sendMessage: (
		chatId: number | string,
		text: string,
		parse_mode?: string,
		reply_to_message_id?: number
	) => Promise<any>;
	setWebhook: (externalUrl: string, secretToken?: string) => Promise<any>;
	getMe: () => Promise<any>;
}

interface App {
	telegram: Telegram;
	db: Database;
}

const processMessage = async (json: TelegramUpdate, app: App): Promise<string> => {
	const { telegram, db } = app;

	const chatId = json.message.chat.id;
	const replyToMessageId = json.message.message_id;
	const languageCode = json.message?.from?.language_code;

	const messageToSave = JSON.stringify(json, null, 2);
	await db.addMessage(messageToSave, json.update_id);

	const messageSender = new MessageSender(app, telegram, languageCode);

	if (json.message.text === '/start') {
		return await messageSender.sendGreeting(chatId, replyToMessageId);
	}

	return 'Skipped message';
};

export { processMessage };
