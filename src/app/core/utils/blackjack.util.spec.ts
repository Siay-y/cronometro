import {
  Card,
  createDeck,
  dealerShouldHit,
  handValue,
  isBlackjack,
  isBust,
  safeDraw,
  settle,
  shuffle,
} from './blackjack.util';

const c = (rank: Card['rank'], suit: Card['suit'] = '♠'): Card => ({ rank, suit });

describe('blackjack.util', () => {
  it('monta um baralho de 52 cartas sem repetir nenhuma', () => {
    const deck = createDeck();
    const keys = new Set(deck.map((card) => card.rank + card.suit));

    expect(deck.length).toBe(52);
    expect(keys.size).toBe(52);
  });

  it('embaralha sem perder nem inventar carta, e obedece ao sorteio', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck, () => 0);

    expect(shuffled.length).toBe(52);
    expect(new Set(shuffled.map((card) => card.rank + card.suit)).size).toBe(52);
    // Com o sorteio sempre em zero a ordem é determinística: o baralho original ficou intacto.
    expect(deck[0]).toEqual({ rank: 'A', suit: '♠' });
    expect(shuffle(deck, () => 0)).toEqual(shuffled);
  });

  it('conta figuras como dez e o Ás como onze enquanto cabe', () => {
    expect(handValue([c('K'), c('7')])).toBe(17);
    expect(handValue([c('A'), c('9')])).toBe(20);
    expect(handValue([c('A'), c('9'), c('5')])).toBe(15);
    expect(handValue([c('A'), c('A'), c('9')])).toBe(21);
  });

  it('reconhece o vinte e um de primeira só com duas cartas', () => {
    expect(isBlackjack([c('A'), c('Q')])).toBe(true);
    expect(isBlackjack([c('7'), c('7'), c('7')])).toBe(false);
    expect(isBust([c('K'), c('Q'), c('5')])).toBe(true);
  });

  it('diz até que carta dá para puxar sem estourar, contando o Ás como um', () => {
    expect(safeDraw([c('5'), c('6')])).toBe(10);
    expect(safeDraw([c('K'), c('5')])).toBe(6);
    expect(safeDraw([c('K'), c('Q')])).toBe(1);
    // Mão "mole": o Ás abaixa para 1, então qualquer carta cabe.
    expect(safeDraw([c('A'), c('6')])).toBe(10);
    expect(safeDraw([c('K'), c('Q'), c('5')])).toBe(0);
  });

  it('faz o Gambit parar em 16, uma carta antes do dealer de cassino', () => {
    expect(dealerShouldHit([c('K'), c('5')])).toBe(true);
    expect(dealerShouldHit([c('K'), c('6')])).toBe(false);
  });

  describe('quem leva', () => {
    it('vinte e um de primeira é dela na hora', () => {
      expect(settle([c('A'), c('K')], [c('9'), c('9')])).toEqual({
        outcome: 'her',
        verdict: 'her-blackjack',
      });
    });

    it('estourar perde: a única regra que ele não dobra', () => {
      expect(settle([c('K'), c('9'), c('5')], [c('2'), c('3')]).outcome).toBe('gambit');
      expect(settle([c('K'), c('9'), c('5')], [c('2'), c('3')]).verdict).toBe('her-bust');
    });

    it('se ele estoura, ela leva', () => {
      expect(settle([c('2'), c('3')], [c('K'), c('9'), c('5')]).verdict).toBe('gambit-bust');
    });

    it('a mão mais alta leva', () => {
      expect(settle([c('K'), c('9')], [c('K'), c('7')]).verdict).toBe('her-higher');
      expect(settle([c('K'), c('7')], [c('K'), c('9')]).verdict).toBe('gambit-higher');
    });

    it('em empate, ela leva', () => {
      expect(settle([c('K'), c('8')], [c('9'), c('9')])).toEqual({
        outcome: 'her',
        verdict: 'push',
      });
    });
  });
});
