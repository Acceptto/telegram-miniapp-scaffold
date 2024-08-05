import { InitData, User as TMAUser, Chat } from '@telegram-apps/sdk-react';

interface BackendInitData {
	initData: string;
}

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
		firstName: user.firstName,
		...(user.lastName && { lastName: user.lastName }),
		...(user.username && { username: user.username }),
		...(user.languageCode && { languageCode: user.languageCode }),
		...(user.isPremium !== undefined && { isPremium: user.isPremium }),
		...(user.addedToAttachmentMenu !== undefined && {
			addedToAttachmentMenu: user.addedToAttachmentMenu,
		}),
		...(user.allowsWriteToPm !== undefined && { allowsWriteToPm: user.allowsWriteToPm }),
		...(user.photoUrl && { photoUrl: user.photoUrl }),
		...(user.isBot !== undefined && { isBot: user.isBot }),
	};
}

export function transformChat(chat: Chat): Record<string, string | number> {
	return {
		id: chat.id,
		type: chat.type,
		title: chat.title,
		...(chat.username && { username: chat.username }),
		...(chat.photoUrl && { photoUrl: chat.photoUrl }),
	};
}

export function transformInitDataNew(json: any): string {
	const { initData } = json;

	const params = { ...initData };

	// Stringify specific objects if they exist
	['user', 'chat', 'receiver'].forEach(key => {
		if (params[key]) {
			params[key] = JSON.stringify(params[key]);
		}
	});

	return new URLSearchParams(params).toString();
}
