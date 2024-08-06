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
	created_date: string;
	updated_date: string;
	last_auth_timestamp: number;
	telegram_id: number;
	is_bot: boolean;
	first_name: string | null;
	last_name: string | null;
	username: string | null;
	language_code: string | null;
	is_premium: boolean;
	added_to_attachment_menu: boolean;
	allows_write_to_pm: boolean;
	photo_url: string | null;
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
