import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIntegration } from '@telegram-apps/react-router-integration';
import {
	bindMiniAppCSSVars,
	bindThemeParamsCSSVars,
	bindViewportCSSVars,
	initNavigator,
	useLaunchParams,
	useMiniApp,
	useThemeParams,
	useViewport,
	useClosingBehavior,
	useBackButton,
} from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import React, { useEffect, useMemo, useCallback } from 'react';
import { Navigate, Route, Router, Routes, RouteObject } from 'react-router-dom';

import { routes } from '@/navigation/routes';

const queryClient = new QueryClient();

export const App: React.FC = () => {
	const lp = useLaunchParams();
	const miniApp = useMiniApp();
	const themeParams = useThemeParams();
	const viewport = useViewport();
	const closingBehavior = useClosingBehavior();
	const backButton = useBackButton();

	useEffect(() => {
		if (viewport) {
			bindViewportCSSVars(viewport);
			viewport.expand();
		}
	}, [viewport]);

	useEffect(() => {
		bindMiniAppCSSVars(miniApp, themeParams);
	}, [miniApp, themeParams]);

	useEffect(() => {
		bindThemeParamsCSSVars(themeParams);
	}, [themeParams]);

	useEffect(() => {
		closingBehavior.enableConfirmation();
		return () => closingBehavior.disableConfirmation();
	}, [closingBehavior]);

	const navigator = useMemo(() => initNavigator('app-navigation-state'), []);
	const [location, reactNavigator] = useIntegration(navigator);

	useEffect(() => {
		navigator.attach();
		backButton.show();
		return () => {
			navigator.detach();
			backButton.hide();
		};
	}, [navigator, backButton]);

	const renderRoute = useCallback((route: RouteObject) => {
		if (route.index) {
			return <Route key={route.path} index element={route.element} />;
		} else {
			return (
				<Route key={route.path} path={route.path} element={route.element}>
					{route.children?.map(renderRoute)}
				</Route>
			);
		}
	}, []);

	return (
		<AppRoot
			appearance={miniApp.isDark ? 'dark' : 'light'}
			platform={['macos', 'ios'].includes(lp.platform) ? 'ios' : 'base'}
		>
			<QueryClientProvider client={queryClient}>
				<Router location={location} navigator={reactNavigator}>
					<Routes>
						{routes.map(renderRoute)}
						<Route path="*" element={<Navigate to="/" />} />
					</Routes>
				</Router>
			</QueryClientProvider>
		</AppRoot>
	);
};

export default App;
