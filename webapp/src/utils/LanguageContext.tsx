import React, { createContext, useContext, ReactNode } from 'react';
import { getTranslation } from '@/utils/i18n';

interface LanguageContextType {
	languageCode: string;
	t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ languageCode: string; children: ReactNode }> = ({
	languageCode,
	children,
}) => {
	const t = (key: string, fallback?: string) => getTranslation(languageCode, key, fallback);

	return (
		<LanguageContext.Provider value={{ languageCode, t }}>{children}</LanguageContext.Provider>
	);
};

export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};
