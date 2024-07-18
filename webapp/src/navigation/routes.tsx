import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import InitializerPage from '@/pages/InitializerPage/InitializerPage';
import { Spinner } from '@telegram-apps/telegram-ui';

const NotFound = React.lazy(() => import('@/pages/NotFound/NotFound'));

const LazyWrapper: React.FC<{ element: React.ReactNode }> = ({ element }) => (
	<Suspense fallback={<Spinner size="l" />}>{element}</Suspense>
);

export const routes: RouteObject[] = [
	{
		path: '/',
		element: <InitializerPage />,
	},
	{
		path: '/home',
		element: <InitializerPage />,
	},
	{
		path: '/calendar',
		element: <InitializerPage />,
	},
	{
		path: '*',
		element: <LazyWrapper element={<NotFound />} />,
	},
];
