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
    title: 'Skinzinha nova :>>',
    teaser: 'Presentinho novo te esperando no Rivals.',
    message:
      'Vamos jogar com as skins novas mon amour. \n\nCom certeza que você vai querer a do Gambit também, mas por enquanto é só o da Rogue. Espero muito que gosto do seu presentinho.',
    icon: '🎮',
    accent: 'violet',
    opensAt: '2026-09-03T21:00',
    durationMinutes: 2880,
  },
  {
    id: 'gift-03',
    title: 'Tem algo te esperando na Steam',
    teaser: 'Abre a sua Steam, mon amour.',
    message:
      'Abre a Steam. Tem um presente lá, esperando você aceitar.\n\nNotei que esse joguinho estava na sua lista de desejos, e tenho certeza que ele vai representar uma fração do nosso amor :>\n\nAceita, instala e joga hoje. Eu quero ficar do seu lado te assistindo jogar, que é uma coisa que eu gosto de fazer mais do que você imagina.\n\nGambit ainda tem várias cartinhas para ti mon Cher. Ainda tem muitas cartas na manga.',
    icon: '🕹️',
    accent: 'magenta',
    opensAt: '2026-09-06T10:30',
    durationMinutes: 2880,
  },
  {
    id: 'gift-04',
    title: 'Comprinhas onde você quiser',
    teaser: 'Você escolhe o lugar. Eu vou junto.',
    message:
      'Essa carta não tem lugar marcado. Quem escolhe é você ma Cher.\n\nVocê comentou daqueles produtinhos de cuidado pessoal que estava querendo, e eu guardei comigo desde então. Então é simples: a gente vai onde você quiser, e você leva o que você quiser.\n\nSem eu ficar perguntando se precisa mesmo. Você cuidando de você é uma das coisas que eu mais gosto de ver.\n\nVamos? Eu vou junto pra carregar as sacolas :>',
    icon: '🛍️',
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
      'Falta uma hora.\n\nAntes de o relógio virar, eu queria te dizer uma coisa: obrigado por cada dia deste ano que passou foi tudo perfeito e maravilho, cada segundo ao seu ladinho. Os fáceis e principalmente os outros.\n\nFica de olho no contador. Quando ele zerar, tem mais uma coisa te esperando aqui :>>',
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
      'Feliz aniversário, Mon Cher.\n\nEste é o presente que eu venho guardando desde o primeiro card deste site, e que eu prefiro te entregar pessoalmente, olhando no seu rostinho, eu te amo muito.\n\nVem cá.',
    icon: '🎁',
    accent: 'gold',
    opensAt: '2026-09-15T00:05',
    durationMinutes: 2880,
  },
];
