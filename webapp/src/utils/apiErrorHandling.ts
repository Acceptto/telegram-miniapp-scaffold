export class APIError extends Error {
	constructor(
		public status: number,
		public statusText: string,
		public data?: any
	) {
		super(`API error: ${status} ${statusText}`);
		this.name = 'APIError';
	}
}

export class NetworkError extends Error {
	constructor(public originalError: Error) {
		super('Network error occurred');
		this.name = 'NetworkError';
	}
}

export const handleApiError = async (response: Response): Promise<never> => {
	const data = await response.json().catch(() => null);
	throw new APIError(response.status, response.statusText, data);
};
