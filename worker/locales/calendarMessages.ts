import { md } from '@vlad-yakovlev/telegram-md';

type LanguageTag = string; // e.g., 'en', 'es', 'fr', etc.

export function getCalendarLinkMessage(language: LanguageTag): string {
	let message: string;

	switch (language) {
		case 'es':
			message = md`
¡Gracias!
Tu calendario ha sido enviado y está listo para compartir. Siéntete libre de compartir el siguiente mensaje \
o simplemente copiar el enlace de él.
			`;
			break;
		// Add more cases for other languages as needed
		default: // 'en' and fallback
			message = md`
Thanks!
You calendar is submitted and is ready to share. Feel free to share the next message \
or just copy the link from it.
			`;
			break;
	}

	return md.build(message);
}

export function getCalendarShareMessage(
	language: LanguageTag,
	userName: string,
	botName: string,
	calendarRef: string
): string {
	let message: string;

	switch (language) {
		case 'es':
			message = md`${userName} usa ${md.bold('Group Meetup Facilitator')} para organizar una reunión grupal!
Por favor, haz clic en el enlace a continuación para votar por las fechas que te funcionan. Puedes votar por múltiples fechas:
${md.link(`https://t.me/${botName}/calendar?startapp=${calendarRef}`, `https://t.me/${botName}/calendar?startapp=${calendarRef}`)}`;
			break;
		// Add more cases for other languages as needed
		default: // 'en' and fallback
			message = md`${userName} uses ${md.bold('Group Meetup Facilitator')} to organize a group meetup!
Please click on the link below to vote for the dates that work for you. You can vote for multiple dates:
${md.link(`https://t.me/${botName}/calendar?startapp=${calendarRef}`, `https://t.me/${botName}/calendar?startapp=${calendarRef}`)}`;
			break;
	}

	return md.build(message);
}
