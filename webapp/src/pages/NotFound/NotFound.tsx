import React from 'react';
import { Link } from 'react-router-dom';
import { useMainButton, useMiniApp } from '@telegram-apps/sdk-react';
import { Text, Button } from '@telegram-apps/telegram-ui';

const NotFound: React.FC = () => {
	const miniApp = useMiniApp();
	const mainButton = useMainButton();

	React.useEffect(() => {
		mainButton.setText('Go Home');
		mainButton.show();
		mainButton.enable();

		const handleMainButtonClick = () => {
			window.location.href = '/';
		};

		mainButton.on('click', handleMainButtonClick);

		return () => {
			mainButton.off('click', handleMainButtonClick);
			mainButton.hide();
		};
	}, [mainButton]);

	React.useEffect(() => {
		miniApp.ready();
	}, [miniApp]);

	return (
		<div style={{ textAlign: 'center', padding: '20px' }}>
			<Text size={24} weight="1" style={{ marginBottom: '20px' }}>
				404 - Page Not Found
			</Text>
			<Text size={16} style={{ marginBottom: '20px' }}>
				Oops! The page you're looking for doesn't exist.
			</Text>
			<Button onClick={() => (window.location.href = '/')}>Go to Home Page</Button>
		</div>
	);
};

export default NotFound;
