import React, { useCallback, useMemo } from 'react';
import 'react-day-picker/dist/style.css';
import { useInitData, useLaunchParams } from '@telegram-apps/sdk-react';
import { useQuery } from '@tanstack/react-query';
import { Text, Button } from '@telegram-apps/telegram-ui';
import LoadingSpinner from '@/utils/loadingSpinner'; // Adjust the path as needed

import { initMiniApp, InitMiniAppResponse } from '@/api';
import Calendar from '@/pages/Calendar/Calendar';
import Home from '@/pages/Home/Home';

// Constants
const INIT_QUERY_KEY = 'initData';
const ERROR_MESSAGES = {
	INIT_DATA_UNAVAILABLE: 'Initialization data is not available',
	INIT_DATA_RAW_UNAVAILABLE: 'Raw initialization data is not available',
	TOKEN_MISSING: 'Initialization failed: Token is missing',
} as const;

// Types
interface CalendarProps {
	token: string;
	apiRef: string;
}

interface HomeProps {
	token: string;
}

// Custom hook for initialization logic
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

// Reusable components
const ErrorMessage: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
	<div style={{ padding: '20px', textAlign: 'center' }}>
		<Text color="red" size={16}>
			{message}
		</Text>
		<Button onClick={onRetry}>Retry</Button>
	</div>
);

const InitializerPage: React.FC = () => {
	const { isLoading, isError, error, data, refetch } = useInitMiniApp();

	const errorMessage = useMemo(() => {
		if (isError) return error?.message || 'Unknown error';
		if (!data?.token) return ERROR_MESSAGES.TOKEN_MISSING;
		return null;
	}, [isError, error, data]);

	const handleRetry = useCallback(() => {
		refetch();
	}, [refetch]);

	if (isLoading) return <LoadingSpinner />;
	if (errorMessage) return <ErrorMessage message={errorMessage} onRetry={handleRetry} />;

	const { token, startParam, startPage } = data!;

	if (startPage === 'calendar' && startParam) {
		return <Calendar token={token} apiRef={startParam} />;
	}

	return <Home token={token} />;
};

export default InitializerPage;
