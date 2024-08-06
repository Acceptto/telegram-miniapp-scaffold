import { apiFetch } from '@/utils/genericApiFetch';
import {
	TelegramInitData,
	Me,
	InitMiniAppResponse,
	SendDatesResponse,
	CalendarType,
} from '@/types/types';

export const initMiniApp = async (initData: TelegramInitData): Promise<InitMiniAppResponse> => {
	console.log('initdata: ' + initData);
	console.log('initdataStrg: ' + JSON.stringify(initData));
	return apiFetch<InitMiniAppResponse>('/miniApp/init', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(initData),
	});
};

export const getMe = async (token: string) => {
	return apiFetch<{ user: User }>('/miniApp/me', {
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
