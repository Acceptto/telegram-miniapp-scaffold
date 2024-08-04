export interface Setting {
	name: string;
	value: string;
}

export interface Message {
	id: number;
	createdDate: string;
	updatedDate: string;
	message: string;
	updateId: number;
}

export interface User {
	id: number;
	createdDate: string;
	updatedDate: string;
	lastAuthTimestamp: number;
	telegramId: number;
	isBot: boolean;
	firstName: string | null;
	lastName: string | null;
	username: string | null;
	languageCode: string | null;
	isPremium: boolean;
	addedToAttachmentMenu: boolean;
	allowsWriteToPm: boolean;
	photoUrl: string | null;
}

export interface Token {
	id: number;
	createdDate: string;
	updatedDate: string;
	expiredDate: string;
	userId: number;
	tokenHash: Uint8Array;
}

export interface Calendar {
	id: number;
	createdDate: string;
	updatedDate: string;
	calendarJson: string;
	calendarRef: string;
	userId: number;
}
