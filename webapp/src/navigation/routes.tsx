import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import MainPage from '@/pages/MainPage/MainPage';
import { Spinner } from '@telegram-apps/telegram-ui';

const NotFound = React.lazy(() => import('@/pages/NotFound/NotFound'));

const LazyWrapper: React.FC<{ element: React.ReactNode }> = ({ element }) => (
	<Suspense fallback={<Spinner size="l" />}>{element}</Suspense>
);

export const routes: RouteObject[] = [
	{
		path: '/',
		element: <MainPage />,
	},
	{
		path: '/home',
		element: <MainPage />,
	},
	{
		path: '/calendar',
		element: <MainPage />,
	},
	{
		path: '*',
		element: <LazyWrapper element={<NotFound />} />,
	},
];
