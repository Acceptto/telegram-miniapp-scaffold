import { type InitData } from '@telegram-apps/sdk-react';
import { transformInitData, transformInitDataNew } from '@/utils/transformers';
import { apiFetch } from '@/utils/genericApiFetch';

enum StartPage {
	Calendar = 'calendar',
	Home = 'home',
}

export interface Me {
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

export interface InitMiniAppResponse {
	token: string;
	startParam?: string | null;
	startPage: StartPage;
	user: Me;
}

export interface SendDatesResponse {
	success: boolean;
	user: Me;
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

export const initMiniApp = async (
	initData: InitData,
	initDataRaw: string
): Promise<InitMiniAppResponse> => {
	if (!initData || !initDataRaw) {
		throw new Error('Invalid initData or initDataRaw');
	}
	console.log('initFront: ' + JSON.stringify(initData));
	const transformedDataOld = transformInitData(initData, initDataRaw);
	const transformedData = transformInitDataNew(initData);
	console.log('transformedOld: ' + JSON.stringify(transformedDataOld));
	console.log('transformed: ' + JSON.stringify(transformedData));
	console.log('raw: ' + initDataRaw);
	return apiFetch<InitMiniAppResponse>('/miniApp/init', {
		method: 'POST',
		body: initDataRaw,
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
