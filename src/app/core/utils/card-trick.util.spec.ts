import {
  dealTrick,
  OPENING_HAND,
  RETURNED_COUNT,
  SHOWN_COUNT,
  TrickCard,
  TrickHand,
} from './card-trick.util';

function key(card: TrickCard): string {
  return `${card.rank}${card.suit}`;
}

/** A promessa do truque: nenhuma das cartas que voltam estava na mesa antes. */
function keepsThePromise(hand: TrickHand): boolean {
  const before = new Set(hand.shown.map(key));

  return hand.returned.every((card) => !before.has(key(card)));
}

describe('dealTrick', () => {
  it('mostra cinco cartas e devolve quatro', () => {
    const hand = dealTrick();

    expect(hand.shown.length).toBe(SHOWN_COUNT);
    expect(hand.returned.length).toBe(RETURNED_COUNT);
  });

  it('nunca devolve a carta que ela guardou, em nenhuma distribuição', () => {
    // O truque é uma promessa, não uma probabilidade: se falhar uma vez em mil,
    // pode ser justamente na vez em que ela estiver olhando.
    for (let i = 0; i < 1000; i++) {
      expect(keepsThePromise(dealTrick())).toBe(true);
    }
  });

  it('não repete carta nenhuma entre as nove da mesa', () => {
    const hand = dealTrick();
    const all = [...hand.shown, ...hand.returned].map(key);

    expect(new Set(all).size).toBe(SHOWN_COUNT + RETURNED_COUNT);
  });

  it('usa só figuras e ases, que se confundem na memória', () => {
    const hand = dealTrick();

    for (const card of [...hand.shown, ...hand.returned]) {
      expect(['J', 'Q', 'K', 'A']).toContain(card.rank);
    }
  });

  it('sobrevive a um sorteio que devolve exatamente 1', () => {
    // Math.random() nunca chega a 1, mas um índice fora do baralho deixaria
    // buracos na mão, e buracos na mesa entregariam o truque.
    const hand = dealTrick(() => 1);

    expect(hand.shown.every(Boolean)).toBe(true);
    expect(keepsThePromise(hand)).toBe(true);
  });

  it('embaralha de verdade: duas mãos seguidas não são a mesma', () => {
    const first = dealTrick().shown.map(key).join();
    const draws = Array.from({ length: 12 }, () => dealTrick().shown.map(key).join());

    expect(draws.some((draw) => draw !== first)).toBe(true);
  });

  it('a mão de abertura, que vem do servidor, cumpre a mesma promessa', () => {
    expect(OPENING_HAND.shown.length).toBe(SHOWN_COUNT);
    expect(OPENING_HAND.returned.length).toBe(RETURNED_COUNT);
    expect(keepsThePromise(OPENING_HAND)).toBe(true);
  });
});
