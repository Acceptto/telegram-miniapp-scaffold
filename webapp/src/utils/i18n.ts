import en from '../locales/en.json';
import ru from '../locales/ru.json';
import ua from '../locales/ua.json';
import es from '../locales/es.json';
import ptBR from '../locales/pt-BR.json';

const translations: { [key: string]: any } = { en, ru, ua, es, 'pt-BR': ptBR };

export const getTranslation = (
	languageCode: string,
	key: string,
	fallback: string = ''
): string => {
	const keys = key.split('.');
	let result = translations[languageCode] || translations['en'];

	for (const k of keys) {
		if (result[k] === undefined) {
			console.warn(`Translation key "${key}" not found for language "${languageCode}"`);
			return fallback || key;
		}
		result = result[k];
	}

	return result;
};

export const getSupportedLanguageCode = (code: string | undefined): string => {
	const supportedCodes = Object.keys(translations);
	return code && supportedCodes.includes(code) ? code : 'en';
};
