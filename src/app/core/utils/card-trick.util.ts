/** Uma carta na mesa: só o que a interface precisa desenhar. */
export interface TrickCard {
  readonly rank: string;
  readonly suit: string;
}

/** As duas mãos de um truque: as cartas que ela vê e as que voltam. */
export interface TrickHand {
  readonly shown: readonly TrickCard[];
  readonly returned: readonly TrickCard[];
}

export const SHOWN_COUNT = 5;
export const RETURNED_COUNT = 4;

/**
 * Só figuras e ases.
 *
 * É esta escolha que sustenta a ilusão: cartas de figura se parecem à
 * distância, então a memória guarda "tinha um valete de espadas" e não a mesa
 * inteira. Com números, a troca geral saltaria aos olhos.
 */
const RANKS = ['J', 'Q', 'K', 'A'] as const;
const SUITS = ['♠', '♥', '♦', '♣'] as const;

/**
 * Distribui um truque das cinco cartas.
 *
 * O golpe é este: ela guarda uma das cinco na cabeça, o baralho embaralha e
 * voltam quatro. Nenhuma das quatro é nenhuma das cinco, então a carta dela
 * sumiu. A de qualquer outra pessoa olhando também some, e é por isso que o
 * truque nunca erra: não há nada para acertar. O site jamais pergunta qual era.
 *
 * As nove cartas saem de um mesmo embaralhamento, sem repetir nenhuma, então a
 * carta dela não pode voltar por acaso — a garantia é da construção, não da
 * sorte.
 */
export function dealTrick(random: () => number = Math.random): TrickHand {
  const deck: TrickCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ rank, suit });
  }

  const needed = SHOWN_COUNT + RETURNED_COUNT;

  // Fisher-Yates parcial: embaralha só as nove primeiras posições, que é tudo
  // o que a mão consome. O resto do baralho não interessa a ninguém.
  for (let i = 0; i < needed; i++) {
    const span = deck.length - i;
    const j = i + Math.min(Math.floor(random() * span), span - 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return { shown: deck.slice(0, SHOWN_COUNT), returned: deck.slice(SHOWN_COUNT, needed) };
}

/**
 * Mão de abertura, fixa de propósito.
 *
 * O HTML do servidor e o primeiro render do navegador precisam ser idênticos,
 * senão a hidratação acusa divergência. O componente sorteia outra mão assim
 * que o navegador assume o controle — como a seção fica bem abaixo da dobra,
 * essa troca acontece muito antes de alguém chegar nela.
 */
export const OPENING_HAND: TrickHand = {
  shown: [
    { rank: 'Q', suit: '♥' },
    { rank: 'J', suit: '♠' },
    { rank: 'K', suit: '♦' },
    { rank: 'A', suit: '♣' },
    { rank: 'K', suit: '♥' },
  ],
  returned: [
    { rank: 'J', suit: '♦' },
    { rank: 'A', suit: '♠' },
    { rank: 'Q', suit: '♣' },
    { rank: 'K', suit: '♠' },
  ],
};
