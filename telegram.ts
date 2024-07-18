import { hmacSha256, hex } from './cryptoUtils';

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org/bot';

class TelegramAPI {
	private token: string;
	private apiBaseUrl: string;

	constructor(token: string, useTestApi: boolean = false) {
		this.token = token;
		const testApiAddendum = useTestApi ? 'test/' : '';
		this.apiBaseUrl = `${TELEGRAM_API_BASE_URL}${token}/${testApiAddendum}`;
	}

	async calculateHashes(initData: string): Promise<any> {
		const urlParams = new URLSearchParams(initData);

		const expectedHash = urlParams.get('hash') || '';
		urlParams.delete('hash');
		urlParams.sort();

		let dataCheckString = '';

		for (const [key, value] of urlParams.entries()) {
			dataCheckString += `${key}=${value}\n`;
		}

		dataCheckString = dataCheckString.slice(0, -1);
		let data: any = Object.fromEntries(urlParams);
		data.user = JSON.parse(data.user || 'null');
		data.receiver = JSON.parse(data.receiver || 'null');
		data.chat = JSON.parse(data.chat || 'null');

		const secretKey = await hmacSha256(this.token, 'WebAppData');
		const calculatedHash = hex(await hmacSha256(dataCheckString, secretKey));

		return { expectedHash, calculatedHash, data };
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

	async setWebhook(externalUrl: string, secretToken?: string): Promise<any> {
		const params: any = {
			url: externalUrl,
		};
		if (secretToken) {
			params.secret_token = secretToken;
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
