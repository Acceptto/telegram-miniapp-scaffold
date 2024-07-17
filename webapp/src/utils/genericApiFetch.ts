import { NetworkError, handleApiError } from './apiErrorHandling';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || '';

if (!BACKEND_URL || !BACKEND_URL.startsWith('https://')) {
	throw new Error('Invalid or missing VITE_BACKEND_URL environment variable');
}

export const apiFetch = async <T>(
	endpoint: string,
	options: RequestInit = {},
	retries = 3
): Promise<T> => {
	try {
		const response = await fetch(`${BACKEND_URL}${endpoint}`, {
			...options,
			mode: 'cors',
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		});

		if (!response.ok) {
			await handleApiError(response);
		}

		return response.json();
	} catch (error) {
		if (retries > 0 && error instanceof NetworkError) {
			return apiFetch<T>(endpoint, options, retries - 1);
		}
		throw error;
	}
};
