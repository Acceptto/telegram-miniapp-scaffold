import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { DayPicker, SelectMultipleEventHandler } from 'react-day-picker';
import {
	useMiniApp,
	useMainButton,
	initPopup,
	initHapticFeedback,
	Popup,
} from '@telegram-apps/sdk-react';
import { useMutation } from '@tanstack/react-query';
import { Text, Spinner } from '@telegram-apps/telegram-ui';

import { sendDates } from '@/api';
import 'react-day-picker/dist/style.css';
import styles from './Home.module.css';

interface HomeProps {
	token: string;
}

const Home: React.FC<HomeProps> = ({ token }) => {
	const miniapp = useMiniApp();
	const mainButton = useMainButton();
	const popup = initPopup();
	const [selectedDates, setSelectedDates] = useState<Date[]>([]);

	// Initialize haptic feedback
	const hapticFeedback = initHapticFeedback();

	useEffect(() => {
		miniapp.ready();
	}, [miniapp]);

	const dateMutation = useMutation({
		mutationKey: ['sendDate', token],
		mutationFn: async (dates: Date[]) => {
			const formattedDates = dates.map(date => format(date, 'yyyy-MM-dd'));
			return sendDates(token, formattedDates);
		},
		onSuccess: () => {
			miniapp.close(true);
		},
		onError: error => {
			popup
				.open({
					title: 'Error',
					message: `${error instanceof Error ? error.message : 'An error occurred'}. Please try again.`,
					buttons: [
						{ id: 'ok', type: 'default', text: 'OK' },
						{ id: 'retry', type: 'default', text: 'Retry' },
					],
				})
				.then((buttonId: string | null) => {
					if (buttonId === 'retry') {
						dateMutation.mutate(selectedDates);
					}
				});
		},
	});

	const handleMainButtonClick = useCallback(() => {
		if (selectedDates.length > 0) {
			// Trigger haptic feedback
			hapticFeedback.impactOccurred('medium');

			dateMutation.mutate(selectedDates);
		}
	}, [selectedDates, dateMutation, hapticFeedback]);

	useEffect(() => {
		if (selectedDates.length > 0) {
			mainButton.setText('Select dates');
			mainButton.show();
			if (dateMutation.isLoading) {
				mainButton.disable();
				mainButton.showLoader();
			} else {
				mainButton.enable();
				mainButton.hideLoader();
			}
			mainButton.on('click', handleMainButtonClick);
		} else {
			mainButton.hide();
		}
		return () => {
			mainButton.off('click', handleMainButtonClick);
		};
	}, [selectedDates, dateMutation.isLoading, mainButton, handleMainButtonClick]);

	const handleSelectDates: SelectMultipleEventHandler = useCallback(days => {
		setSelectedDates(days || []);
	}, []);

	const footer = useMemo(() => {
		if (selectedDates.length === 0) {
			return <Text>Please pick the days you propose for the meetup.</Text>;
		}
		return (
			<Text>
				You picked {selectedDates.length} {selectedDates.length > 1 ? 'dates' : 'date'}:{' '}
				{selectedDates.map((date, index) => (
					<React.Fragment key={date.getTime()}>
						{index ? ', ' : ''}
						{format(date, 'PP')}
					</React.Fragment>
				))}
			</Text>
		);
	}, [selectedDates]);

	if (dateMutation.isLoading) {
		return <Spinner size="l" />;
	}

	return (
		<div className={styles.container}>
			<h2 className={styles.title}>Pick proposed dates</h2>
			<DayPicker
				mode="multiple"
				weekStartsOn={1}
				min={1}
				max={5}
				selected={selectedDates}
				onSelect={handleSelectDates}
				footer={footer}
				disabled={dateMutation.isLoading}
			/>
		</div>
	);
};

export default Home;
