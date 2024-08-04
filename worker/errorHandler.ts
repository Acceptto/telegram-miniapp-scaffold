export class AppError extends Error {
	constructor(
		public statusCode: number,
		message: string
	) {
		super(message);
		this.name = 'AppError';
	}
}

export function handleError(error: unknown): Response {
	if (error instanceof AppError) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: error.statusCode,
			headers: { 'Content-Type': 'application/json' },
		});
	} else {
		const message = error instanceof Error ? error.message : 'An unknown error occurred';
		console.error(error);
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
