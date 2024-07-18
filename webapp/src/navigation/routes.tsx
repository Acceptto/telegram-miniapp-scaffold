import React, { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import Initializer from '@/pages/Initializer/Initializer';
import { Spinner } from '@telegram-apps/telegram-ui';

const NotFound = React.lazy(() => import('@/pages/NotFound/NotFound'));

const LazyWrapper: React.FC<{ element: React.ReactNode }> = ({ element }) => (
	<Suspense fallback={<Spinner size="l" />}>{element}</Suspense>
);

export const routes: RouteObject[] = [
	{
		path: '/',
		element: <Initializer />,
	},
	{
		path: '/home',
		element: <Initializer />,
	},
	{
		path: '/calendar',
		element: <Initializer />,
	},
	{
		path: '*',
		element: <LazyWrapper element={<NotFound />} />,
	},
];
