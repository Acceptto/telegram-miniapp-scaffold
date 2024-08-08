import { hmacSha256, hex } from '@/cryptoUtils';
import { CalculateHashesResult } from '@/types/types';

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org/bot';

class TelegramAPI {
	private token: string;
	private apiBaseUrl: string;

	constructor(token: string, useTestApi: boolean = false) {
		this.token = token;
		const testApiAddendum = useTestApi ? 'test/' : '';
		this.apiBaseUrl = `${TELEGRAM_API_BASE_URL}${token}/${testApiAddendum}`;
	}

	async calculateHashes(initData: string): Promise<{
		expected_hash: string;
		calculated_hash: string;
		data: CalculateHashesResult['data'];
	}> {
		const urlParams = new URLSearchParams(initData);
		const expected_hash = urlParams.get('hash') || '';
		urlParams.delete('hash');
		urlParams.sort();

		const dataCheckString = Array.from(urlParams.entries())
			.map(([key, value]) => `${key}=${value}`)
			.join('\n');

		const data: any = Object.fromEntries(urlParams);
		['user', 'receiver', 'chat'].forEach(key => {
			if (data[key]) {
				try {
					data[key] = JSON.parse(data[key]);
				} catch (error) {
					console.error(`Failed to parse ${key}:`, error);
				}
			}
		});

		const secretKey = await hmacSha256(this.token, 'WebAppData');
		const calculated_hash = hex(await hmacSha256(dataCheckString, secretKey));

		return { expected_hash, calculated_hash, data };
	}

	async getUpdates(lastUpdateId?: number): Promise<any> {
		const url = `${this.apiBaseUrl}getUpdates`;
		const params: any = {};
		if (lastUpdateId) {
			params.offset = lastUpdateId + 1;
		}

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		});
		return response.json();
	}

	async sendMessage(
		chatId: number | string,
		text: string,
		parse_mode?: string,
		reply_to_message_id?: number
	): Promise<any> {
		const url = `${this.apiBaseUrl}sendMessage`;
		const params: any = {
			chat_id: chatId,
			text: text,
		};
		if (parse_mode) {
			params.parse_mode = parse_mode;
		}
		if (reply_to_message_id) {
			params.reply_to_message_id = reply_to_message_id;
		}
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		});
		return response.json();
	}

	async setWebhook(external_url: string, secret_token?: string): Promise<any> {
		const params: any = {
			url: external_url,
		};
		if (secret_token) {
			params.secret_token = secret_token;
		}
		const url = `${this.apiBaseUrl}setWebhook`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		});
		return response.json();
	}

	async getMe(): Promise<any> {
		const url = `${this.apiBaseUrl}getMe`;
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		return response.json();
	}
}

export { TelegramAPI as Telegram };
