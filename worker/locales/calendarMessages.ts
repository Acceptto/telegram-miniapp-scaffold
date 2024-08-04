import { Markdown, md } from '@vlad-yakovlev/telegram-md';
import { LanguageTag } from '@/types/types';

export function getCalendarLinkMessage(language: LanguageTag): string {
	let message: Markdown;
	switch (language) {
		case 'es':
			message = md`
¡Gracias!
Tu calendario ha sido enviado y está listo para compartir. Siéntete libre de compartir el siguiente mensaje \
o simplemente copiar el enlace de él.
			`;
			break;
		case 'uk':
			message = md`
Дякуємо!
Ваш календар надіслано і готовий до поширення. Ви можете поділитися наступним повідомленням \
або просто скопіювати посилання з нього.
			`;
			break;
		case 'ru':
			message = md`
Спасибо!
Ваш календарь отправлен и готов к распространению. Вы можете поделиться следующим сообщением \
или просто скопировать ссылку из него.
			`;
			break;
		case 'pt-BR':
			message = md`
Obrigado!
Seu calendário foi enviado e está pronto para ser compartilhado. Sinta-se à vontade para compartilhar a próxima mensagem \
ou apenas copiar o link dela.
			`;
			break;
		default: // 'en' and fallback
			message = md`
Thanks!
Your calendar is submitted and is ready to share. Feel free to share the next message \
or just copy the link from it.
			`;
			break;
	}
	return md.build(message);
}

export function getCalendarShareMessage(
	language: LanguageTag,
	userName: string | null,
	botName: string,
	calendarRef: string
): string {
	let message: Markdown;
	switch (language) {
		case 'es':
			message = md`${userName} usa ${md.bold('Group Meetup Facilitator')} para organizar una reunión grupal!
Por favor, haz clic en el enlace a continuación para votar por las fechas que te funcionan. Puedes votar por múltiples fechas:
${md.link(`https://t.me/${botName}/calendar?startapp=${calendarRef}`, `https://t.me/${botName}/calendar?startapp=${calendarRef}`)}`;
			break;
		case 'uk':
			message = md`${userName} використовує ${md.bold('Group Meetup Facilitator')} для організації групової зустрічі!
Будь ласка, натисніть на посилання нижче, щоб проголосувати за дати, які вам підходять. Ви можете проголосувати за кілька дат:
${md.link(`https://t.me/${botName}/calendar?startapp=${calendarRef}`, `https://t.me/${botName}/calendar?startapp=${calendarRef}`)}`;
			break;
		case 'ru':
			message = md`${userName} использует ${md.bold('Group Meetup Facilitator')} для организации групповой встречи!
Пожалуйста, нажмите на ссылку ниже, чтобы проголосовать за подходящие вам даты. Вы можете проголосовать за несколько дат:
${md.link(`https://t.me/${botName}/calendar?startapp=${calendarRef}`, `https://t.me/${botName}/calendar?startapp=${calendarRef}`)}`;
			break;
		case 'pt-BR':
			message = md`${userName} usa o ${md.bold('Group Meetup Facilitator')} para organizar um encontro em grupo!
Por favor, clique no link abaixo para votar nas datas que funcionam para você. Você pode votar em várias datas:
${md.link(`https://t.me/${botName}/calendar?startapp=${calendarRef}`, `https://t.me/${botName}/calendar?startapp=${calendarRef}`)}`;
			break;
		default: // 'en' and fallback
			message = md`${userName} uses ${md.bold('Group Meetup Facilitator')} to organize a group meetup!
Please click on the link below to vote for the dates that work for you. You can vote for multiple dates:
${md.link(`https://t.me/${botName}/calendar?startapp=${calendarRef}`, `https://t.me/${botName}/calendar?startapp=${calendarRef}`)}`;
			break;
	}
	return md.build(message);
}
