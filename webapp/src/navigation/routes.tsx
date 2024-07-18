import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import initializer from '@/pages/initializer/initializer';
import { Spinner } from '@telegram-apps/telegram-ui';

const NotFound = React.lazy(() => import('@/pages/NotFound/NotFound'));

const LazyWrapper: React.FC<{ element: React.ReactNode }> = ({ element }) => (
	<Suspense fallback={<Spinner size="l" />}>{element}</Suspense>
);

export const routes: RouteObject[] = [
	{
		path: '/',
		element: <initializer />,
	},
	{
		path: '/home',
		element: <initializer />,
	},
	{
		path: '/calendar',
		element: <initializer />,
	},
	{
		path: '*',
		element: <LazyWrapper element={<NotFound />} />,
	},
];
