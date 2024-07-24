import { useCloudStorage } from '@telegram-apps/sdk-react';

interface CachedItem<T> {
	value: T;
	expiration?: number; // Make expiration optional
}

const DEFAULT_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export const cacheWithCloudStorage = (cloudStorage: ReturnType<typeof useCloudStorage>) => {
	const isExpired = (expiration?: number): boolean => {
		if (expiration === undefined) return false; // Never expires if no expiration set
		return Date.now() > expiration;
	};

	return {
		async get<T>(key: string): Promise<T | null> {
			try {
				const item = await cloudStorage.get(key);
				if (!item) return null;
				const cachedItem: CachedItem<T> = JSON.parse(item);
				if (isExpired(cachedItem.expiration)) {
					await this.delete(key);
					return null;
				}
				return cachedItem.value;
			} catch (error) {
				console.error(`Error getting item from cache: ${error}`);
				return null;
			}
		},

		async set<T>(key: string, value: T, expirationMs?: number): Promise<void> {
			try {
				const item: CachedItem<T> = {
					value,
					...(expirationMs !== undefined && { expiration: Date.now() + expirationMs }),
				};
				await cloudStorage.set(key, JSON.stringify(item));
			} catch (error) {
				console.error(`Error setting item in cache: ${error}`);
			}
		},

		async delete(key: string): Promise<void> {
			try {
				await cloudStorage.delete(key);
			} catch (error) {
				console.error(`Error deleting item from cache: ${error}`);
			}
		},

		async has(key: string): Promise<boolean> {
			try {
				const item = await cloudStorage.get(key);
				if (!item) return false;
				const cachedItem: CachedItem<any> = JSON.parse(item);
				return !isExpired(cachedItem.expiration);
			} catch (error) {
				console.error(`Error checking cache for key: ${error}`);
				return false;
			}
		},

		async checkExpiration(key: string): Promise<boolean> {
			try {
				const item = await cloudStorage.get(key);
				if (!item) return true;
				const cachedItem: CachedItem<any> = JSON.parse(item);
				return isExpired(cachedItem.expiration);
			} catch (error) {
				console.error(`Error checking expiration for key: ${error}`);
				return true;
			}
		},
	};
};
