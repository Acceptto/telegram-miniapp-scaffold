import React, { useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import {
	useMainButton,
	useMiniApp,
	useBackButton,
	useHapticFeedback,
	LaunchParams,
	useLaunchParams,
} from '@telegram-apps/sdk-react';
import { LargeTitle, Subheadline, Caption, Steps, Link } from '@telegram-apps/telegram-ui';
import Lottie, { LottieRefCurrentProps } from 'lottie-light-react';
import { useDrag } from '@use-gesture/react';
import { useLanguage } from '@/utils/LanguageContext';
import styles from './Onboarding.module.css';

import welcomeAnimation from '@/assets/animations/welcome.json';
import createEventsAnimation from '@/assets/animations/create-events.json';
import voteDatesAnimation from '@/assets/animations/vote-dates.json';
import notificationsAnimation from '@/assets/animations/notifications.json';

interface OnboardingProps {
	onComplete: () => void;
}

type Slide = {
	title: string;
	content: string;
	animation: unknown;
};

type AnimationState = { status: 'loaded' } | { status: 'error'; message: string };

type State = {
	currentSlide: number;
	animationState: AnimationState;
};

type Action =
	| { type: 'NEXT_SLIDE' }
	| { type: 'PREV_SLIDE' }
	| { type: 'SET_SLIDE'; payload: number }
	| { type: 'SET_ANIMATION_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case 'NEXT_SLIDE':
			return { ...state, currentSlide: state.currentSlide + 1 };
		case 'PREV_SLIDE':
			return { ...state, currentSlide: state.currentSlide - 1 };
		case 'SET_SLIDE':
			return { ...state, currentSlide: action.payload };
		case 'SET_ANIMATION_ERROR':
			return { ...state, animationState: { status: 'error', message: action.payload } };
		default:
			return state;
	}
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
	const { t } = useLanguage();
	const [state, dispatch] = useReducer(reducer, {
		currentSlide: 0,
		animationState: { status: 'loaded' },
	});

	const miniApp = useMiniApp();
	const launch = useLaunchParams();
	const mainButton = useMainButton();
	const backButton = useBackButton();
	const hapticFeedback = useHapticFeedback();
	const lottieRef = useRef<LottieRefCurrentProps>(null);

	const slides: Slide[] = useMemo(
		() =>
			t('onboarding.slides').map((slide: any, index: number) => ({
				...slide,
				animation: [
					welcomeAnimation,
					createEventsAnimation,
					voteDatesAnimation,
					notificationsAnimation,
				][index],
			})),
		[t]
	);

	const changeSlide = useCallback(
		(newSlide: number) => {
			if (newSlide >= 0 && newSlide < slides.length && newSlide !== state.currentSlide) {
				dispatch({ type: 'SET_SLIDE', payload: newSlide });
				if (lottieRef.current) lottieRef.current.goToAndPlay(0);
				hapticFeedback.impactOccurred('medium');
			}
		},
		[hapticFeedback, slides.length, state.currentSlide]
	);

	const nextSlide = useCallback(
		() => changeSlide(state.currentSlide + 1),
		[changeSlide, state.currentSlide]
	);
	const prevSlide = useCallback(
		() => changeSlide(state.currentSlide - 1),
		[changeSlide, state.currentSlide]
	);

	const bind = useDrag(
		({ down, movement: [mx], direction: [xDir], velocity: [vx] }) => {
			const trigger = !down && (Math.abs(mx) > 20 || Math.abs(vx) > 0.1);
			if (trigger) {
				xDir < 0 ? nextSlide() : prevSlide();
			}
		},
		{ axis: 'x' }
	);

	useEffect(() => {
		miniApp.ready();
	}, [miniApp]);

	const handleMainButtonClick = useCallback(() => {
		hapticFeedback.impactOccurred('medium');
		if (state.currentSlide === slides.length - 1) {
			mainButton.showLoader();
			onComplete();
			mainButton.hideLoader();
		} else {
			nextSlide();
		}
	}, [state.currentSlide, slides.length, hapticFeedback, onComplete, nextSlide, mainButton]);

	useEffect(() => {
		const isLastSlide = state.currentSlide === slides.length - 1;

		mainButton.setParams({
			text: isLastSlide ? t('common.getStarted') : t('common.next'),
			isEnabled: true,
		});
		mainButton.show();

		mainButton.on('click', handleMainButtonClick);
		backButton.on('click', prevSlide);

		return () => {
			mainButton.off('click', handleMainButtonClick);
			backButton.off('click', prevSlide);
		};
	}, [
		state.currentSlide,
		mainButton,
		backButton,
		slides.length,
		handleMainButtonClick,
		prevSlide,
		t,
	]);

	useEffect(() => {
		state.currentSlide > 0 ? backButton.show() : backButton.hide();
	}, [state.currentSlide, backButton]);

	const handleLottieError = useCallback(
		(event: React.SyntheticEvent<HTMLDivElement, Event>) => {
			console.error('Lottie animation failed to load:', event);
			dispatch({
				type: 'SET_ANIMATION_ERROR',
				payload: t('error.animationLoad'),
			});
		},
		[t]
	);

	const lottieStyle = useMemo(
		() => ({
			width: '100%',
			height: '100%',
		}),
		[]
	);

	return (
		<div className={styles.container} {...bind()} aria-label={t('onboarding.title')}>
			<Steps
				count={slides.length}
				progress={state.currentSlide + 1}
				className={styles.stepsComponent}
			/>
			<div className={styles.slideContainer}>
				<div
					className={styles.slideWrapper}
					style={{
						transform: `translateX(-${state.currentSlide * 100}%)`,
						transition: 'transform 0.3s ease-out',
					}}
				>
					{slides.map((slide, index) => (
						<div key={index} className={styles.slide}>
							<div className={styles.animationContainer}>
								{state.animationState.status === 'error' ? (
									<Caption className={styles.errorMessage}>{state.animationState.message}</Caption>
								) : (
									<Lottie
										lottieRef={lottieRef}
										animationData={slide.animation}
										loop={true}
										autoplay={true}
										style={lottieStyle}
										onError={handleLottieError}
									/>
								)}
							</div>
							<LargeTitle className={styles.title}>
								{index === 0 && launch.initData?.user?.firstName
									? `${slide.title}, ${launch.initData.user.firstName}!`
									: slide.title}
							</LargeTitle>
							<Subheadline className={styles.content}>{slide.content}</Subheadline>
						</div>
					))}
				</div>
			</div>
			{state.currentSlide === slides.length - 1 && (
				<Caption level="2" weight="3" className={styles.termsText}>
					{t('onboarding.termsPrefix')} <br />
					<Link href="https://telegram.org/tos/mini-apps">{t('onboarding.termsLink')}</Link>{' '}
					{t('common.and')} <Link href="/privacy">{t('onboarding.privacyLink')}</Link>
				</Caption>
			)}
		</div>
	);
};

export default Onboarding;
