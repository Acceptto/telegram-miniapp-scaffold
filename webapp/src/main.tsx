import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.tsx';
import '@/index.css';
import { SDKProvider } from '@telegram-apps/sdk-react';
import ErrorBoundary from '@/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<ErrorBoundary>
			<SDKProvider acceptCustomStyles debug>
				<App />
			</SDKProvider>
		</ErrorBoundary>
	</React.StrictMode>
);
