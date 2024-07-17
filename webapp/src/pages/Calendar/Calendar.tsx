import React, { useState, useMemo } from 'react';
import { DayPicker, SelectMultipleEventHandler } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Text } from '@telegram-apps/telegram-ui';

import { getCalendarByRef, CalendarType } from '@/api';
import 'react-day-picker/dist/style.css';

interface CalendarProps {
	token: string;
	apiRef: string;
}

const Calendar: React.FC<CalendarProps> = ({ token, apiRef }) => {
	const [selectedDates, setSelectedDates] = useState<Date[]>([]);

	const { data, isLoading, error } = useQuery<{ calendar: CalendarType }, Error>({
		queryKey: ['calendar', apiRef],
		queryFn: () => getCalendarByRef(token, apiRef),
	});

	const disabledMatcher = useMemo(() => {
		if (!data) return () => false;
		const enabledDates = new Set(data.calendar.dates);
		return (date: Date) => !enabledDates.has(date.toISOString().split('T')[0]);
	}, [data]);

	const handleSelectDates: SelectMultipleEventHandler = dates => {
		setSelectedDates(dates || []);
	};

	if (isLoading) return <Spinner size="l" />;
	if (error) return <Text color="red">Error: {error.message}</Text>;

	return (
		<div>
			<h2>Pick out of proposed dates</h2>
			<DayPicker
				mode="multiple"
				weekStartsOn={1}
				min={0}
				selected={selectedDates}
				onSelect={handleSelectDates}
				disabled={isLoading || disabledMatcher}
			/>
		</div>
	);
};

export default Calendar;
