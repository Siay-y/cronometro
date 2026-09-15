import { Outcome, Verdict } from '../core/utils/blackjack.util';

/**
 * =============================================================================
 *  O QUE O GAMBIT DIZ NA MESA DE VINTE E UM
 * =============================================================================
 *  Cada momento da mão tem uma lista de falas; a mesa sorteia uma. Escreva
 *  quantas quiser em cada lista, no tom dele. `{v}` vira o valor da mão dela.
 */
export interface BlackjackLines {
  /** Antes de a primeira mão ser dada. */
  readonly invite: readonly string[];
  /** As cartas acabaram de cair. */
  readonly deal: readonly string[];
  /** Ela está com 11 ou menos: pedir é de graça. */
  readonly low: readonly string[];
  /** Ela está entre 12 e 16: a zona do medo. */
  readonly middle: readonly string[];
  /** Ela está com 17 ou mais: parar é o certo. */
  readonly high: readonly string[];
  /** Ela pediu carta. */
  readonly hit: readonly string[];
  /** Ela parou; ele vira a carta escondida. */
  readonly stand: readonly string[];
  /** Ela dobrou: a mão passa a valer dois pontos, e ela recebe uma carta só. */
  readonly double: readonly string[];
  /** Ele puxa uma carta. */
  readonly draw: readonly string[];
  /** Como a mão terminou. */
  readonly verdict: Readonly<Record<Verdict, readonly string[]>>;
  /** Alguém chegou aos doze pontos: a série acabou. */
  readonly match: Readonly<Record<Outcome, readonly string[]>>;
}

export const BLACKJACK_LINES: BlackjackLines = {
  invite: [
    'Senta aqui, chère. Uma mão só. Eu prometo que jogo limpo... quase.',
    'O Gambit nunca perde no vinte e um. Menos para você.',
  ],
  deal: [
    'As cartas estão na mesa, mon amour.',
    'Cortei o baralho pensando em você. Vamos ver no que deu.',
    'Duas para você, duas para mim. A minha de baixo fica em segredo.',
  ],
  low: ['{v}. Eu pediria mais uma sem pensar.', 'Com {v} não tem como estourar. Pede, chère.'],
  middle: [
    '{v}... é aqui que todo mundo hesita. Eu também hesitaria.',
    '{v}. Confia no seu coração ou nas minhas cartas?',
    'Chère, {v} é uma aposta. Mas você sempre foi a minha.',
  ],
  high: [
    '{v}. Se eu fosse você, parava aí. E eu sou eu.',
    '{v}, mon amour. Não desafia a sorte, ela já gosta de você.',
  ],
  hit: ['Mais uma, saindo.', 'Lá vai.', 'Uma cartinha para a senhorita.'],
  stand: [
    'Parou aí? Corajosa. Minha vez.',
    'Certo. Vamos ver o que eu escondi.',
    'Segurou a mão. Agora eu mostro a minha.',
  ],
  double: [
    'Dobrou? Uma carta só, e ela decide tudo. Gosto de quem joga assim.',
    'Vale dois agora, chère. Lá vai a sua carta, e depois é comigo.',
    'Dobrando a aposta contra o Gambit... corajosa. Uma carta, e a mão é minha de jogar.',
  ],
  draw: ['Eu puxo mais uma.', 'Preciso de carta.', 'Só mais uma para mim.'],
  verdict: {
    'her-blackjack': [
      'Vinte e um de primeira. Eu devia saber que era você.',
      'Blackjack. Nem eu roubaria tão bem.',
    ],
    'her-bust': [
      'Estourou... mas o Gambit não cobra de quem ele ama.',
      'Passou de vinte e um. Eu faço vista grossa, dessa vez e das próximas.',
    ],
    'gambit-bust': [
      'Estourei. Por você eu estouro todo dia.',
      'Passei. Você tem esse efeito na minha sorte.',
    ],
    'her-higher': ['Você ganhou, mon amour. De novo.', 'Sua mão. Como sempre foi.'],
    'gambit-higher': [
      'Essa mão foi minha, chère. Só essa. Dá as cartas de novo.',
      'Minha mão era maior. Um ponto para mim, e nada mais que isso.',
      'Ganhei essa, mon amour. Deixa eu aproveitar, que é raro.',
    ],
    push: ['Empate. Leva, é sua.', 'Deu igual. Entre a gente, igual é seu.'],
  },
  match: {
    her: [
      'Doze. A mesa é sua, mon amour. Sempre foi.',
      'Doze pontos. Eu entrego o baralho, o casaco e o resto.',
    ],
    gambit: [
      'Doze para mim? Isso não vai ficar assim. Série nova, e eu jogo pior, prometo.',
      'Fechei a série. Não conta para ninguém, chère: quero a revanche.',
    ],
  },
};
