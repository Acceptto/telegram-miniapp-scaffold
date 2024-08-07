export interface Setting {
	name: string;
	created_date: string;
	updated_date: string;
	value: string;
}

export interface Message {
	id?: number;
	created_date: string;
	updated_date: string;
	message: string;
	update_id: string;
}

export interface InitDataCheck {
	id?: number;
	created_date: string;
	updated_date: string;
	init_data: string;
	expected_hash: string;
	calculated_hash: string;
}

export interface User {
	id: number;
	created_date: string;
	updated_date: string;
	last_auth_timestamp: string;
	telegram_id: number;
	first_name: string;
	username?: string;
	is_bot?: number;
	last_name?: string;
	language_code?: string;
	is_premium?: number;
	added_to_attachment_menu?: number;
	allows_write_to_pm?: number;
	photo_url?: string;
}

export interface Token {
	id?: number;
	created_date: string;
	updated_date: string;
	expired_date: string;
	token_hash: string;
	user_id: number;
}

export interface Calendar {
	id?: number;
	created_date: string;
	updated_date: string;
	user_id: number;
	calendar_json: string;
	calendar_ref: string;
}

export interface SelectedDate {
	id?: number;
	created_date: string;
	updated_date: string;
	user_id: number;
	calendar_id: number;
	selected_dates_json: string;
}
