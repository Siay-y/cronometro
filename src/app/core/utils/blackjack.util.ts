/**
 * As regras do vinte e um, sem nenhuma tela por perto: baralho, valor da mão e
 * quem levou. O Gambit é generoso de propósito (ver `settle` e `DEALER_STANDS_AT`).
 */

export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
}

/** Quem leva a mão. Empate não existe: ele deixa ela levar. */
export type Outcome = 'her' | 'gambit';

/** Por que a mão terminou como terminou; é o que escolhe a fala dele. */
export type Verdict =
  'her-blackjack' | 'her-bust' | 'gambit-bust' | 'her-higher' | 'gambit-higher' | 'push';

export const BLACKJACK = 21;
/**
 * Um dealer de cassino puxa até 17. O Gambit para em 16: com uma mão a menos
 * de força ele estoura mais e ganha menos, e é isso que se quer numa mesa em
 * que a intenção é ela sair ganhando.
 */
export const DEALER_STANDS_AT = 16;
/** A série: quem chega primeiro a tantos pontos leva a mesa. */
export const MATCH_TARGET = 12;

/** O placar entre os dois. */
export interface Tally {
  readonly her: number;
  readonly gambit: number;
}

/** Quem fechou a série, se alguém já chegou lá. */
export function matchWinner(tally: Tally): Outcome | null {
  if (tally.her >= MATCH_TARGET) return 'her';
  if (tally.gambit >= MATCH_TARGET) return 'gambit';

  return null;
}

const SUITS: readonly Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: readonly Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/** As 52 cartas, em ordem de fábrica. */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ rank, suit });
  }

  return deck;
}

/** Fisher-Yates. Recebe o sorteio de fora para os testes mandarem na sorte. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const deck = [...items];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.min(Math.floor(random() * (i + 1)), i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/** Quanto vale uma carta sozinha, com o Ás em 11 (a mão abaixa para 1 se precisar). */
export function cardValue(card: Card): number {
  if (card.rank === 'A') return 11;
  if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') return 10;

  return Number(card.rank);
}

/** O melhor valor da mão: cada Ás vale 11 enquanto couber, e 1 depois disso. */
export function handValue(cards: readonly Card[]): number {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card);
    if (card.rank === 'A') aces++;
  }
  while (total > BLACKJACK && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

/**
 * A maior carta que ela pode puxar sem estourar, de 0 a 10 (10 quer dizer
 * "qualquer uma"). Conta os Ases como 1: é o pior caso da mão, e é o que
 * importa para saber se dá para pedir sem medo.
 */
export function safeDraw(cards: readonly Card[]): number {
  let hard = 0;
  for (const card of cards) hard += card.rank === 'A' ? 1 : cardValue(card);

  return Math.max(0, Math.min(10, BLACKJACK - hard));
}

/** Vinte e um de primeira: Ás e uma carta de dez, nas duas primeiras. */
export function isBlackjack(cards: readonly Card[]): boolean {
  return cards.length === 2 && handValue(cards) === BLACKJACK;
}

export function isBust(cards: readonly Card[]): boolean {
  return handValue(cards) > BLACKJACK;
}

/** O Gambit ainda puxa carta? Ele para em `DEALER_STANDS_AT`. */
export function dealerShouldHit(cards: readonly Card[]): boolean {
  return handValue(cards) < DEALER_STANDS_AT;
}

/**
 * Quem levou a mão, e por quê.
 *
 * As regras da casa, todas a favor dela: vinte e um de primeira ganha na
 * hora; estourar perde (regra honesta, senão o jogo não é jogo); e em empate
 * ela leva, porque ele nunca cobraria dela.
 */
export function settle(
  her: readonly Card[],
  gambit: readonly Card[],
): { outcome: Outcome; verdict: Verdict } {
  if (isBust(her)) return { outcome: 'gambit', verdict: 'her-bust' };
  if (isBlackjack(her)) return { outcome: 'her', verdict: 'her-blackjack' };
  if (isBust(gambit)) return { outcome: 'her', verdict: 'gambit-bust' };

  const hers = handValue(her);
  const his = handValue(gambit);
  if (hers > his) return { outcome: 'her', verdict: 'her-higher' };
  if (hers < his) return { outcome: 'gambit', verdict: 'gambit-higher' };

  return { outcome: 'her', verdict: 'push' };
}
