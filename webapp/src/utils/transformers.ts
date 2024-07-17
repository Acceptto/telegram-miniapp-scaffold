import { InitData, User as TMAUser, Chat } from '@telegram-apps/sdk-react';

interface BackendInitData {
	initData: string;
}

/**
 * Transforms the frontend init data to the format expected by the backend.
 * @param frontendData The init data from the frontend
 * @param initDataRaw The raw init data string
 * @returns The transformed init data
 */
export function transformInitData(frontendData: InitData, initDataRaw: string): BackendInitData {
	const params = new URLSearchParams(initDataRaw);

	if (!params.get('user') && frontendData.user) {
		params.set('user', JSON.stringify(transformUser(frontendData.user)));
	}

	if (!params.get('receiver') && frontendData.receiver) {
		params.set('receiver', JSON.stringify(transformUser(frontendData.receiver)));
	}

	if (!params.get('chat') && frontendData.chat) {
		params.set('chat', JSON.stringify(transformChat(frontendData.chat)));
	}

	return { initData: params.toString() };
}

export function transformUser(user: TMAUser): Record<string, string | number | boolean | null> {
	return {
		id: user.id,
		first_name: user.firstName,
		...(user.lastName && { last_name: user.lastName }),
		...(user.username && { username: user.username }),
		...(user.languageCode && { language_code: user.languageCode }),
		...(user.isPremium !== undefined && { is_premium: user.isPremium }),
		...(user.addedToAttachmentMenu !== undefined && {
			added_to_attachment_menu: user.addedToAttachmentMenu,
		}),
		...(user.allowsWriteToPm !== undefined && { allows_write_to_pm: user.allowsWriteToPm }),
		...(user.photoUrl && { photo_url: user.photoUrl }),
		...(user.isBot !== undefined && { is_bot: user.isBot }),
	};
}

export function transformChat(chat: Chat): Record<string, string | number> {
	return {
		id: chat.id,
		type: chat.type,
		title: chat.title,
		...(chat.username && { username: chat.username }),
		...(chat.photoUrl && { photo_url: chat.photoUrl }),
	};
}
