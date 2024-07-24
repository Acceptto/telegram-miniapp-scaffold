import React, { useMemo } from 'react';
import { useInitData, useLaunchParams, useCloudStorage } from '@telegram-apps/sdk-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Text, Button } from '@telegram-apps/telegram-ui';
import LoadingSpinner from '@/utils/loadingSpinner';
import { initMiniApp, InitMiniAppResponse } from '@/api';
import Calendar from '@/pages/Calendar/Calendar';
import Home from '@/pages/Home/Home';
import Onboarding from '@/pages/Onboarding/Onboarding';
import { cacheWithCloudStorage } from '@/utils/cacheWithCloudStorage';
import { LanguageProvider, useLanguage } from '@/utils/LanguageContext';
import { getSupportedLanguageCode } from '@/utils/i18n';

// Constants
const INIT_QUERY_KEY = 'initData';
const ONBOARDING_STATUS_KEY = 'hasCompletedOnboarding';
const ERROR_MESSAGES = {
	INIT_DATA_UNAVAILABLE: 'error.initDataUnavailable',
	INIT_DATA_RAW_UNAVAILABLE: 'error.initDataRawUnavailable',
	TOKEN_MISSING: 'error.tokenMissing',
	UNKNOWN: 'error.unknown',
} as const;

// Custom hooks
const useInitMiniApp = () => {
	const initData = useInitData();
	const { initDataRaw } = useLaunchParams();
	return useQuery<InitMiniAppResponse, Error>({
		queryKey: [INIT_QUERY_KEY],
		queryFn: async () => {
			if (!initData) throw new Error(ERROR_MESSAGES.INIT_DATA_UNAVAILABLE);
			if (!initDataRaw) throw new Error(ERROR_MESSAGES.INIT_DATA_RAW_UNAVAILABLE);
			return await initMiniApp(initData, initDataRaw);
		},
		enabled: !!initData && !!initDataRaw,
		retry: 3,
		retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
};

const useOnboardingStatus = () => {
	const cloudStorage = useCloudStorage();
	const cache = useMemo(() => cacheWithCloudStorage(cloudStorage), [cloudStorage]);
	const {
		data: isOnboardingComplete,
		isLoading,
		error,
		refetch,
	} = useQuery<boolean, Error>({
		queryKey: ['onboardingStatus'],
		queryFn: async () => {
			const status = await cache.get<boolean>(ONBOARDING_STATUS_KEY);
			return status ?? false;
		},
		retry: 1,
	});

	const setOnboardingComplete = useMutation({
		mutationFn: async (completed: boolean) => {
			await cache.set(ONBOARDING_STATUS_KEY, completed);
		},
		onSuccess: () => refetch(),
	});

	return {
		isOnboardingComplete,
		isLoading,
		error,
		setOnboardingComplete: setOnboardingComplete.mutate,
	};
};

// Components
const ErrorMessage: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => {
	const { t } = useLanguage();
	return (
		<div style={{ padding: '20px', textAlign: 'center' }}>
			<Text color="red" size={16}>
				{t(message)}
			</Text>
			<Button onClick={onRetry}>{t('common.retry')}</Button>
		</div>
	);
};

const InitializerPage: React.FC = () => {
	const { isLoading: isInitLoading, isError, error, data, refetch } = useInitMiniApp();
	const {
		isOnboardingComplete,
		isLoading: isStatusLoading,
		setOnboardingComplete,
	} = useOnboardingStatus();

	const errorMessage = useMemo(() => {
		if (isError) return error?.message || ERROR_MESSAGES.UNKNOWN;
		if (!data?.token) return ERROR_MESSAGES.TOKEN_MISSING;
		return null;
	}, [isError, error, data]);

	if (isInitLoading || isStatusLoading) return <LoadingSpinner />;
	if (errorMessage) return <ErrorMessage message={errorMessage} onRetry={refetch} />;

	const { token, startParam, startPage, user } = data!;
	const languageCode = getSupportedLanguageCode(user.languageCode);

	let content;
	if (isOnboardingComplete) {
		content = <Home token={token} />;
	} else if (startPage === 'calendar' && startParam) {
		content = <Calendar token={token} apiRef={startParam} />;
	} else {
		content = <Onboarding onComplete={() => setOnboardingComplete(true)} />;
	}

	return <LanguageProvider languageCode={languageCode}>{content}</LanguageProvider>;
};

export default InitializerPage;
