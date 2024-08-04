import { Markdown, md } from '@vlad-yakovlev/telegram-md';
import { LanguageTag } from '@/types/types';

export function getGreetingMessage(language: LanguageTag, botName: string): string {
	let message: Markdown;
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

		case 'uk':
			message = md`Вітаємо!
${md.bold('Group Meetup Facilitator')} допомагає організовувати групові зустрічі, наприклад, особисті події або\
 дзвінки. Ось як це працює:
1. Організатор відкриває ${md.link('календар', `https://t.me/${botName}/calendar`)} \
щоб встановити варіанти, коли група може зустрітися
2. Організатор отримує посилання для розповсюдження в групі
3. Члени групи голосують за варіанти, які їм підходять
4. Організатор отримує підсумок голосування і може вибрати найкращий варіант
І це все!
Перейдіть до ${md.link('календаря', `https://t.me/${botName}/calendar`)}, щоб почати`;
			break;

		case 'ru':
			message = md`Привет!
${md.bold('Group Meetup Facilitator')} помогает организовывать групповые встречи, например, личные мероприятия или\
 звонки. Вот как это работает:
1. Организатор открывает ${md.link('календарь', `https://t.me/${botName}/calendar`)} \
чтобы установить варианты, когда группа может встретиться
2. Организатор получает ссылку для распространения в группе
3. Члены группы голосуют за подходящие им варианты
4. Организатор получает сводку голосов и может выбрать лучший вариант
И это все!
Перейдите в ${md.link('календарь', `https://t.me/${botName}/calendar`)}, чтобы начать`;
			break;

		case 'pt-BR':
			message = md`Olá!
${md.bold('Group Meetup Facilitator')} ajuda você a organizar encontros em grupo, por exemplo, eventos presenciais ou\
 chamadas. Veja como funciona:
1. O organizador acessa o ${md.link('calendário', `https://t.me/${botName}/calendar`)} \
para definir opções de quando o grupo pode se reunir
2. O organizador recebe um link para compartilhar com o grupo
3. Os membros do grupo votam nas opções que funcionam para eles
4. O organizador recebe um resumo dos votos e pode escolher a melhor opção
E é isso!
Vá para o ${md.link('calendário', `https://t.me/${botName}/calendar`)} para começar`;
			break;

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
