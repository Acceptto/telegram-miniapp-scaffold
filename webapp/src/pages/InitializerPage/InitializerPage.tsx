import React, { useMemo } from 'react';
import { useLaunchParams, useCloudStorage } from '@telegram-apps/sdk-react';
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
	const { initDataRaw } = useLaunchParams();
	return useQuery<InitMiniAppResponse, Error>({
		queryKey: [INIT_QUERY_KEY],
		queryFn: async () => {
			if (!initDataRaw) throw new Error(ERROR_MESSAGES.INIT_DATA_RAW_UNAVAILABLE);
			return await initMiniApp(initDataRaw);
		},
		enabled: !!initDataRaw,
		retry: false, // Disable automatic retries
		staleTime: Infinity, // Prevent automatic refetches
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
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100vh', // Full viewport height to center vertically
				padding: '20px',
				textAlign: 'center', // Center text
			}}
		>
			<Text style={{ marginBottom: '20px' }}>{t('common.loadFailed')}</Text>
			<Button
				onClick={onRetry}
				style={{
					marginTop: '20px',
					padding: '10px 20px',
					cursor: 'pointer',
				}}
			>
				{t('common.retry')}
			</Button>
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

	const languageCode = useMemo(() => {
		if (data?.user.languageCode) {
			return getSupportedLanguageCode(data.user.languageCode);
		}
		return 'en';
	}, [data]);

	return (
		<LanguageProvider languageCode={languageCode}>
			{isInitLoading || isStatusLoading ? (
				<LoadingSpinner />
			) : errorMessage ? (
				<ErrorMessage message={errorMessage} onRetry={refetch} />
			) : isOnboardingComplete ? (
				<Home token={data!.token} />
			) : data?.startPage === 'calendar' && data.startParam ? (
				<Calendar token={data.token} apiRef={data.startParam} />
			) : (
				<Onboarding onComplete={() => setOnboardingComplete(true)} />
			)}
		</LanguageProvider>
	);
};

export default InitializerPage;
