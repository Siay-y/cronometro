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
 *  • `icon`            o emblema no centro da carta: o nome de um ícone do
 *                      baralho (`joker`, `gamepad`, `joystick`, `bag`, `letter`,
 *                      `ribbon`, `gift`, `spade`), desenhado com a tinta da
 *                      carta, ou um símbolo/emoji solto, mostrado como texto.
 *  • `letter`          opcional. Quando existe, a revelação ganha um envelope
 *                      lacrado: ela aperta o botão, o lacre estala, a aba
 *                      levanta e o papel sai de dentro. É onde vão os textos
 *                      longos, que não caberiam no `message`.
 *  • `photo`           opcional. Uma foto num porta-retratos de papel logo
 *                      depois do último parágrafo; tocar nela abre de perto.
 *                      Com `foil: true`, vem coberta por uma raspadinha.
 *  • `finale`          opcional, `true` só no presente principal: painel
 *                      dourado, o Ás no estouro de naipes, as outras cartas
 *                      voando dos cards para um leque atrás dele, e a mensagem
 *                      se escrevendo ao vivo, com o "Vem cá." por último.
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
    icon: 'joker',
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
    icon: 'gamepad',
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
    icon: 'joystick',
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
    icon: 'bag',
    accent: 'violet',
    opensAt: '2026-09-08T19:00',
    durationMinutes: 2880,
  },
  {
    id: 'gift-05',
    title: 'Uma cartinha para você',
    teaser: 'Fechada com cera. Só você pode quebrar o lacre.',
    message:
      'Espero muito que goste desse presentinho, Mon Cher.\n\nEscrevi essa cartinha pensando em cada palavra, quero que se sinta abraça e muito amada por mim nesse momento :>.\n\nEssa cartinha fica guardada aqui, então você pode voltar e abrir de novo sempre que quiser.',
    icon: 'letter',
    accent: 'magenta',
    opensAt: '2026-09-10T18:30',
    durationMinutes: 2880,
    letter: {
      cta: 'Abrir a carta',
      body:
        'Bonjour, Mon Cher,\n\n' +
        'Espero muito que esteja se sentindo bem agora, fica bem confortável porque vou falar bastante nessa cartinha para ti.\n\n' +
        'Seu aniversário está quase chegando, eu fico extremamente feliz e grato por poder te proporcionar tanta coisa legal e que te faz se sentir amada, protegida e muito bem cuidada :>.\n\n' +
        'O tempo passou muito rápido, mas eu me lembro de cada segundinho perto de você, é tudo tão calmo, tudo tão bonito, ao seu lado eu sinto que as coisas fazem muito mais sentido, que as cores tem muito mais vida, e que esse tempinho ainda vai durar muito, vai durar o nosso para sempre.\n\n' +
        'Você é uma mulher tão maravilhosa que nem mesmo se eu escrevesse livros sobre os meus sentimentos por ti seriam capazes de dizer tudo que eu sinto, vejo e amo. Seu jeitinho doce ao meu lado, suas brincadeiras, seu jeito de se vestir, seu perfume, tudo é perfeito e único.\n\n' +
        'Sempre vou estar do seu ladinho, eu quero cuidar de você, dos seus sentimentos, daquilo que importa para você, cuidar dos seus medos, das nossas memórias juntinhos e com certeza do seu coraçãozinho tão grande e cheio de pureza.\n\n' +
        'Sei que errei algumas vezes com você, mas eu quero ser sempre o seu lugar seguro, quero que se sinto muito bem comigo, que não tenha medo de estar ao meu lado e ser você, essa princesinha tão brilhante, só de pensar em você e de estar escrevendo essa carta já sinto uma felicidade gigante no meu peito, porque eu sei o quanto você importa para mim, mon Amour.\n\n' +
        'Muito obrigado por sempre me amar do melhor jeitinho, do seu jeitinho. Eu tenho um orgulho tão imenso de ti, das coisinhas que faz e sempre quis fazer, de tudo. Você me inspira todos os dias a ser um homem melhor, para mim, para você, por nós. Me inspira em sempre seguir em frente mesmo quando tudo está contra.\n\n' +
        'Você é e sempre será a minha mulher, aquela que eu darei minha vida se for preciso, e que eu amarei com todo o meu coração, Deus sempre vai estar juntinho a nós, então você tem muita proteção além de mim ao seu lado Cher.\n\n' +
        'Beijinho*. Mon Amour. Eu te amo mucho, mucho, mucho, e vou estar bem aqui do seu ladinho para ver, uma por uma, cada coisa linda que ainda está vindo para você e pela a gente. te amando incondicionalmente.',
      closing: 'Assinado, votre Cajun',
      signature: 'Gambit',
      photos: [
        { src: '/fotos/foto-1.jpg', alt: 'Uma foto nossa', caption: 'Eu...' },
        { src: '/fotos/foto-2.jpg', alt: 'Uma foto nossa', caption: 'Te amo...' },
        { src: '/fotos/foto-3.jpg', alt: 'Uma foto nossa', caption: 'Com todo o meu coração e alma.' },
      ],
      // O convite para ela responder, no fim da folha. Tire este bloco e a
      // folha em branco some junto.
      reply: {
        invite: 'E agora é a sua vez, Mon Cher. Escreve aqui, que eu vou guardar.',
        placeholder: 'pode ser uma linha só...',
      },
    },
    // ↑↑↑ ESCREVA AQUI ↑↑↑
  },
  {
    id: 'gift-06',
    title: 'Um segredinho embrulhado',
    teaser: 'Tem uma caixa dentro desta carta. E um segredo dentro da caixa.',
    message:
      'Hoje o presente vem embrulhado, Mon Cher.\n\nTem um segredinho guardado aí dentro...\n\nDepois me conta se você gostou :>',
    icon: 'ribbon',
    accent: 'gold',
    opensAt: '2026-09-12T14:23',
    durationMinutes: 2880,
    // ↓↓↓ A CAIXA ↓↓↓  `reveal` é o que fica escrito embaixo da foto.
    gift: {
      teaser: 'Tem um segredinho guardado aqui dentro.',
      photo: {
        src: '/fotos/porta-retratos.jpg',
        alt: 'Um porta-retratos com um desenho nosso',
        caption: 'para ficar do lado da sua cama',
      },
      reveal:
        'Um porta-retratos, Mon Cher.\n\nEu queria que a gente ficasse num lugar que você olha todo dia sem querer: na cabeceira, na mesa, onde você acorda. Assim, mesmo nos dias em que eu não estiver por perto, tem um pedacinho nosso de olho em você.\n\nO de verdade chega nas suas mãos hoje. Esse aqui é só para você saber o que vem :>\n\nToca na foto para ver de perto. E vira ela: tem uma coisinha escrita atrás.',
      // O que está escrito à mão atrás da foto. Ela vê quando vira o retrato.
      back:
        'Mon Amour,\n\nsempre que olhar para cá, lembra: eu estou do seu ladinho, mesmo quando não estou por perto.\n\nTe amo mucho, mucho, mucho.\n\nGambit ♠',
    },
    // ↑↑↑ A CAIXA ↑↑↑
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
    icon: 'gift',
    accent: 'gold',
    opensAt: '2026-09-15T00:05',
    durationMinutes: 2880,
    // O único que abre com estouro de naipes, painel dourado e o "Vem cá."
    // chegando sozinho no fim.
    finale: true,
    // A foto que chega logo depois do "Vem cá.", num porta-retratos, coberta
    // por uma raspadinha: ela raspa com o dedo para revelar.
    photo: {
      src: '/fotos/imagem-final-1.jpg',
      alt: 'Uma foto nossa',
      caption: 'te amo, Mon Cher',
      foil: true,
    },
  },
];
