import { GiftEvent } from '../core/models/gift-event.model';

/**
 * =============================================================================
 *  A LISTA DE PRESENTES
 * =============================================================================
 *  Edite à vontade: cada item vira um card na Área de Eventos.
 *
 *  • `opensAt`         quando o presente destrava, no formato `AAAA-MM-DDTHH:mm`, hora local.
 *  • `durationMinutes` por quanto tempo ele fica em destaque. Depois disso vira
 *                      "lembrança": continua acessível, só sai dos holofotes.
 *                      (1 dia = 1440, 2 dias = 2880.)
 *  • `accent`          'magenta' | 'violet' | 'gold'.
 *
 *  Dica: dá para montar tudo pelo painel (5 toques no naipe do rodapé) e usar
 *  o botão "Copiar como código" para colar a lista pronta aqui.
 */
export const GIFT_EVENTS: readonly GiftEvent[] = [
  {
    id: 'gift-01',
    title: 'A primeira carta',
    teaser: 'Tudo começa com uma carta virada para baixo.',
    message:
      'Toda boa história do Gambit começa com uma carta na mão.\n\nEsta aqui é a minha: durante as próximas duas semanas, vai aparecer um presente novo neste site de tempos em tempos. Nenhum deles abre antes da hora, nem se você insistir.\n\nEntão volta aqui, tá? Eu prometo que vale a pena :>',
    icon: '🃏',
    accent: 'magenta',
    opensAt: '2026-09-02T20:00',
    durationMinutes: 2880,
  },
  {
    id: 'gift-02',
    title: 'A trilha sonora de nós dois',
    teaser: 'Coloca o fone. Este aqui é para ouvir.',
    message:
      'Fiz uma playlist com as músicas que, de um jeito ou de outro, viraram nossas.\n\nAlgumas você vai reconhecer na primeira nota. Outras você nem sabia que eu tinha reparado que você gostava.\n\nEscuta na ordem, porque eu pensei na ordem.',
    icon: '🎧',
    accent: 'violet',
    opensAt: '2026-09-04T19:00',
    durationMinutes: 2880,
  },
  {
    id: 'gift-03',
    title: 'Café da manhã fora de hora',
    teaser: 'Um vale-alguma-coisa, resgatável a qualquer momento.',
    message:
      'Este presente é um vale.\n\nQualquer dia, em qualquer horário, inclusive às três da tarde, você me chama e eu preparo o café da manhã inteiro do jeito que você gosta.\n\nSem prazo de validade. Só precisa dizer a palavra.',
    icon: '☕',
    accent: 'gold',
    opensAt: '2026-09-06T10:00',
    durationMinutes: 2880,
  },
  {
    id: 'gift-04',
    title: 'Sessão da noite',
    teaser: 'Luz apagada, cobertor, e você escolhe o filme.',
    message:
      'Hoje a tela é sua.\n\nVocê escolhe o filme, eu faço a pipoca e não reclamo nem uma vez se for o mesmo que a gente já viu três vezes.\n\nE sim: pode ser algum dos X-Men. Eu sei exatamente de quem você vai ficar olhando a tela inteira.',
    icon: '🎬',
    accent: 'violet',
    opensAt: '2026-09-08T21:00',
    durationMinutes: 2880,
  },
  {
    id: 'gift-05',
    title: 'Um bilhete escondido',
    teaser: 'Tem algo esperando por você em algum lugar da casa.',
    message:
      'Existe um bilhete escrito à mão escondido em um lugar que só você usa todo dia.\n\nNão vou dizer onde. Mas você vai encontrar hoje, e vai sorrir sozinha quando encontrar.\n\nEu conheço esse sorriso.',
    icon: '💌',
    accent: 'magenta',
    opensAt: '2026-09-10T18:30',
    durationMinutes: 2880,
  },
  {
    id: 'gift-06',
    title: 'Jantar à luz de vela',
    teaser: 'Reserva feita. Só falta você dizer sim.',
    message:
      'Separa a noite. Só isso.\n\nO resto (lugar, hora, o que a gente vai comer) já está resolvido. Você só precisa aparecer e ser exatamente do jeito que você é.\n\nJá te aviso: eu vou olhar para você mais do que para o prato.',
    icon: '🍷',
    accent: 'gold',
    opensAt: '2026-09-12T20:00',
    durationMinutes: 2880,
  },
  {
    id: 'gift-07',
    title: 'A última carta antes da meia-noite',
    teaser: 'Uma hora. Depois disso, o ano vira.',
    message:
      'Falta uma hora.\n\nAntes de o relógio virar, eu queria te dizer uma coisa: obrigado por cada dia deste ano que passou. Os fáceis e principalmente os outros.\n\nFica de olho no contador. Quando ele zerar, tem mais uma coisa te esperando aqui.',
    icon: '♠',
    accent: 'magenta',
    opensAt: '2026-09-14T23:00',
    durationMinutes: 60,
  },
  {
    id: 'gift-08',
    title: 'O presente principal',
    teaser: 'Aquele que eu venho segurando desde o começo.',
    message:
      'Feliz aniversário, Mon Cher.\n\nEste é o presente que eu venho guardando desde o primeiro card deste site, e que eu prefiro te entregar pessoalmente, olhando na sua cara.\n\nVem cá.',
    icon: '🎁',
    accent: 'gold',
    opensAt: '2026-09-15T00:05',
    durationMinutes: 2880,
  },
];
