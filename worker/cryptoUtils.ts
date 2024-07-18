export const sha256 = async (body: string): Promise<Uint8Array> => {
	const enc = new TextEncoder();
	const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(body));
	return new Uint8Array(hashBuffer);
};

export const hmacSha256 = async (
	body: string,
	secret: string | Uint8Array
): Promise<Uint8Array> => {
	const enc = new TextEncoder();
	const algorithm = { name: 'HMAC', hash: 'SHA-256' };
	if (!(secret instanceof Uint8Array)) {
		secret = enc.encode(secret);
	}
	const key = await crypto.subtle.importKey('raw', secret, algorithm, false, ['sign', 'verify']);

	const signature = await crypto.subtle.sign(algorithm.name, key, enc.encode(body));

	return new Uint8Array(signature);
};

export const hex = (buffer: Uint8Array): string => {
	const hashArray = Array.from(buffer);

	// convert bytes to hex string
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateSecret = (bytes: number): string => {
	return hex(crypto.getRandomValues(new Uint8Array(bytes)));
};
