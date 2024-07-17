import { type InitData } from '@telegram-apps/sdk-react';
import { transformInitData } from '@/utils/transformers';
import { apiFetch } from '@/utils/genericApiFetch';

enum StartPage {
	Calendar = 'calendar',
	Home = 'home',
}

export interface Me {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
	is_premium?: boolean;
	added_to_attachment_menu?: boolean;
	can_join_groups?: boolean;
	can_read_all_group_messages?: boolean;
	supports_inline_queries?: boolean;
	can_connect_to_business?: boolean;
}

export interface User {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
	is_premium?: boolean;
	added_to_attachment_menu?: boolean;
	createdDate: DateString;
	updatedDate: DateString;
	lastAuthTimestamp: string;
	telegramId: number;
	allowsWriteToPm: number;
	photoUrl: string | null;
}

export interface InitMiniAppResponse {
	token: string;
	startParam?: string | null;
	startPage: StartPage;
	user: User;
}

export interface SendDatesResponse {
	success: boolean;
	user: User;
}

export interface CalendarType {
	id: number;
	createdDate: string;
	updatedDate: string;
	userId: number;
	calendarJson: string;
	calendarRef: string;
	dates: string[];
}

type DateString = string; // Format: "YYYY-MM-DD HH:mm:ss"

export const initMiniApp = async (
	initData: InitData,
	initDataRaw: string
): Promise<InitMiniAppResponse> => {
	if (!initData || !initDataRaw) {
		throw new Error('Invalid initData or initDataRaw');
	}
	const transformedData = transformInitData(initData, initDataRaw);
	return apiFetch<InitMiniAppResponse>('/miniApp/init', {
		method: 'POST',
		body: JSON.stringify(transformedData),
	});
};

export const getMe = async (token: string) => {
	return apiFetch<{ user: Me }>('/miniApp/me', {
		headers: { Authorization: `Bearer ${token}` },
	});
};

export const getCalendarByRef = async (
	token: string,
	ref: string
): Promise<{ calendar: CalendarType }> => {
	return apiFetch<{ calendar: CalendarType }>(`/miniApp/calendar/${ref}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
};

export const sendDates = async (token: string, dates: string[]): Promise<SendDatesResponse> => {
	return apiFetch<SendDatesResponse>('/miniApp/dates', {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ dates }),
	});
};
