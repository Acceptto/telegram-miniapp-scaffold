import { MessageSender } from '@/messageSender';
import { App, TelegramMessage, TelegramUpdate } from '@/types/types';

const processMessage = async (json: TelegramUpdate, app: App): Promise<string> => {
	const { telegram, db } = app;

	const chatId = json.message.chat.id;
	const replyToMessageId = json.message.message_id;
	const languageCode = json.message?.from?.language_code;

	const messageToSave = JSON.stringify(json, null, 2);
	await db.addMessage(messageToSave, json.update_id);

	const messageSender = new MessageSender(app, languageCode);

	if (json.message.text === '/start') {
		return await messageSender.sendGreeting(chatId, replyToMessageId);
	}

	return 'Skipped message';
};

export { processMessage };
