import { md } from '@vlad-yakovlev/telegram-md';

type LanguageTag = string; // e.g., 'en', 'es', 'fr', etc.

export function getGreetingMessage(language: LanguageTag, botName: string): string {
	let message: string;

	switch (language) {
		case 'es':
			message = md`¡Hola!
${md.bold('Group Meetup Facilitator')} te ayuda a organizar reuniones grupales, por ejemplo, eventos presenciales o\
 llamadas. Así es cómo funciona:
1. El organizador accede al ${md.link('calendario', `https://t.me/${botName}/calendar`)} \
para establecer opciones de cuándo el grupo puede reunirse
2. El organizador recibe un enlace para compartir con el grupo
3. Los miembros del grupo votan por las opciones que les funcionan
4. El organizador recibe un resumen de los votos y puede elegir la mejor opción
¡Y eso es todo!
Ve al ${md.link('calendario', `https://t.me/${botName}/calendar`)} para comenzar`;
			break;
		// Add more cases for other languages as needed
		default: // 'en' and fallback
			message = md`Hello!
${md.bold('Group Meetup Facilitator')} helps you organize group meetups, e.g. in-person events or\
 calls. Here's how it works:
1. Organizer accesses ${md.link('the calendar', `https://t.me/${botName}/calendar`)} \
to set options for when the group can meet
2. Organizer receives a link to share with the group
3. Group members vote for the options that work for them
4. Organizer receives a summary of the votes and can pick the best option
And that's it!
Go to ${md.link('the calendar', `https://t.me/${botName}/calendar`)} to get started`;
			break;
	}

	return md.build(message);
}
