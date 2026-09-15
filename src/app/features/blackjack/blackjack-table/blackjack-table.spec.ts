import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Card, createDeck, handValue, settle, shuffle } from '../../../core/utils/blackjack.util';
import { BLACKJACK_LINES } from '../../../data/blackjack-lines.data';
import { BlackjackTable } from './blackjack-table';

const DEAL_STEP_MS = 320;
const REVEAL_MS = 420;
const DRAW_MS = 900;
const TALLY_KEY = 'mon-cher:vinte-e-um:v1';
/**
 * O sorteio preso neste valor dá K♣ J♣ para ela e Q♣ 10♣ para ele: vinte a
 * vinte, sem vinte e um de primeira, e a próxima carta (9♣) estoura quem pedir.
 */
const RIGGED = 0.99;

describe('BlackjackTable', () => {
  let fixture: ComponentFixture<BlackjackTable>;
  let host: HTMLElement;
  /** O baralho que a mesa vai usar: com o sorteio preso em RIGGED, a ordem é esta. */
  let deck: Card[];

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(RIGGED);
    localStorage.removeItem(TALLY_KEY);
    deck = shuffle(createDeck(), () => RIGGED);

    await TestBed.configureTestingModule({ imports: [BlackjackTable] }).compileComponents();

    fixture = TestBed.createComponent(BlackjackTable);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function advance(ms: number): void {
    vi.advanceTimersByTime(ms);
    fixture.detectChanges();
  }

  /** A jogada com esse rótulo, acesa (a vez dela) ou não. */
  function button(label: string): HTMLButtonElement | null {
    return (
      [...host.querySelectorAll<HTMLButtonElement>('.actions button')].find(
        (item) => item.querySelector('.play__label')?.textContent?.trim() === label,
      ) ?? null
    );
  }

  function hint(label: string): string {
    return button(label)?.querySelector('.play__hint')?.textContent?.trim() ?? '';
  }

  /** As jogadas de pedir e parar estão na mesa, mas apagadas. */
  function chipsCold(): boolean {
    const chips = [button('Mais uma'), button('Parar')];
    return chips.every((chip) => chip?.disabled === true);
  }

  function cards(seat: 'her' | 'gambit'): number {
    return host.querySelectorAll(`.seat--${seat} .hand > *`).length;
  }

  function voice(): string {
    return host.querySelector('.voice')?.textContent?.trim() ?? '';
  }

  /** A fala que a mesa sorteia de uma lista com o sorteio preso em RIGGED. */
  function pick(lines: readonly string[]): string {
    return lines[Math.min(Math.floor(RIGGED * lines.length), lines.length - 1)];
  }

  /** As cartas saem do fim do baralho: a dela, a dele, a dela, a escondida dele. */
  function dealt(): { her: Card[]; gambit: Card[]; rest: Card[] } {
    const top = [...deck].reverse();
    return { her: [top[0], top[2]], gambit: [top[1], top[3]], rest: top.slice(4) };
  }

  function dealHand(): void {
    button('Dar as cartas')!.click();
    fixture.detectChanges();
    advance(DEAL_STEP_MS * 4);
  }

  it('começa com o convite dele, a mesa vazia e o placar zerado', () => {
    expect(voice()).toBe(BLACKJACK_LINES.invite[0]);
    expect(cards('her')).toBe(0);
    expect(button('Dar as cartas')).toBeTruthy();
    expect(host.querySelector('.tally')?.textContent).toContain('0');
  });

  it('dá as cartas uma de cada vez, a segunda dele virada para baixo', () => {
    button('Dar as cartas')!.click();
    fixture.detectChanges();

    expect(cards('her')).toBe(0);
    // Enquanto as cartas caem, as fichas já estão na mesa, mas apagadas.
    expect(chipsCold()).toBe(true);
    expect(hint('Parar')).toBe('calma, chère');

    advance(DEAL_STEP_MS);
    expect(cards('her')).toBe(1);
    advance(DEAL_STEP_MS);
    expect(cards('gambit')).toBe(1);
    advance(DEAL_STEP_MS * 2);
    expect(cards('her')).toBe(2);
    expect(cards('gambit')).toBe(2);
    expect(host.querySelector('.hole')?.classList.contains('is-revealed')).toBe(false);
    expect(host.querySelector('.seat--gambit .seat__value')?.textContent).toContain('+ ?');
  });

  it('abre a vez dela com um conselho sobre a mão', () => {
    dealHand();

    const value = handValue(dealt().her);
    const list = value <= 11 ? 'low' : value < 17 ? 'middle' : 'high';

    expect(button('Mais uma')?.disabled).toBe(false);
    expect(button('Parar')?.disabled).toBe(false);
    // Vinte na mão: só um Ás não estoura, e parar é ficar com os vinte.
    expect(hint('Mais uma')).toBe('só um ás cabe');
    expect(hint('Parar')).toBe(`fico com ${value}`);
    expect(voice()).toBe(pick(BLACKJACK_LINES[list]).replace('{v}', String(value)));
    expect(host.querySelector('.seat--her .seat__value')?.textContent?.trim()).toBe(String(value));
  });

  it('entrega mais uma carta quando ela pede, e estourar encerra a mão na hora', () => {
    dealHand();
    expect(cards('her')).toBe(2);

    button('Mais uma')!.click();
    fixture.detectChanges();

    // Vinte mais o 9♣: passou. Ele não cobra, mas a mão acabou.
    expect(cards('her')).toBe(3);
    expect(host.querySelector('.seat--her .seat__value')?.classList.contains('is-bust')).toBe(true);
    expect(voice()).toBe(pick(BLACKJACK_LINES.verdict['her-bust']));
    expect(button('Outra mão')).toBeTruthy();
    expect(host.querySelector('.felt')?.classList.contains('felt--gambit')).toBe(true);
  });

  it('resolve o vinte e um de primeira sem esperar por ela', () => {
    // Com o sorteio em zero, ela recebe A♠ e Q♣.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    dealHand();

    expect(host.querySelector('.hole')?.classList.contains('is-revealed')).toBe(true);
    expect(voice()).toBe(BLACKJACK_LINES.verdict['her-blackjack'][0]);
    expect(host.querySelector('.felt')?.classList.contains('felt--her')).toBe(true);
    expect(button('Outra mão')).toBeTruthy();
  });

  it('quando ela para, ele vira a escondida, puxa até 16 e acerta as contas', () => {
    dealHand();
    button('Parar')!.click();
    fixture.detectChanges();

    expect(voice()).toBe(pick(BLACKJACK_LINES.stand));
    // A vez é dele: as fichas esfriam, mas continuam na mesa.
    expect(chipsCold()).toBe(true);

    advance(REVEAL_MS);
    expect(host.querySelector('.hole')?.classList.contains('is-revealed')).toBe(true);

    // Ele puxa o que precisar; um baralho não dá mais que isso de cartas.
    advance(DRAW_MS * 12);

    const gambitCards = cards('gambit');
    const { her, rest } = dealt();
    const gambit = [...dealt().gambit, ...rest.slice(0, gambitCards - 2)];
    const { outcome, verdict } = settle(her, gambit);

    expect(handValue(gambit) >= 16 || handValue(gambit) > 21).toBe(true);
    expect(voice()).toBe(pick(BLACKJACK_LINES.verdict[verdict]));
    expect(button('Outra mão')).toBeTruthy();
    expect(host.querySelector('.felt')?.classList.contains(`felt--${outcome}`)).toBe(true);
  });

  it('guarda o placar no aparelho e o traz de volta', () => {
    dealHand();
    button('Parar')!.click();
    advance(REVEAL_MS + DRAW_MS * 12);

    const saved = JSON.parse(localStorage.getItem(TALLY_KEY) ?? '{}') as {
      her: number;
      gambit: number;
    };

    expect(saved.her + saved.gambit).toBe(1);
    expect(host.querySelector('.tally')?.textContent).toContain('1');
  });

  it('dobrar vale dois pontos: uma carta só, e a vez passa para ele', () => {
    dealHand();
    expect(button('Dobrar')?.disabled).toBe(false);

    button('Dobrar')!.click();
    fixture.detectChanges();

    // A vez dela fechou na hora; a carta ainda vai cair.
    expect(voice()).toBe(pick(BLACKJACK_LINES.double));
    expect(chipsCold()).toBe(true);
    expect(host.querySelector('.stake')?.textContent?.trim()).toBe('vale 2');

    // Vinte mais o 9♣: estourou, e a mão dobrada custa dois.
    advance(DEAL_STEP_MS);
    expect(cards('her')).toBe(3);
    expect(voice()).toBe(pick(BLACKJACK_LINES.verdict['her-bust']));
    expect(JSON.parse(localStorage.getItem(TALLY_KEY)!)).toEqual({ her: 0, gambit: 2 });

    // A mão seguinte começa sem a aposta dobrada.
    button('Outra mão')!.click();
    fixture.detectChanges();
    advance(DEAL_STEP_MS * 4);
    expect(host.querySelector('.stake')).toBeNull();
    expect(button('Dobrar')?.disabled).toBe(false);
  });

  it('fecha a série nos doze pontos e abre outra do zero', () => {
    // Ela chega à mesa com onze; a mão presa (vinte a vinte) é empate, e empate é dela.
    localStorage.setItem(TALLY_KEY, JSON.stringify({ her: 11, gambit: 0 }));
    fixture = TestBed.createComponent(BlackjackTable);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;

    dealHand();
    button('Parar')!.click();
    // Ele já tem vinte: não puxa, só acerta as contas.
    advance(REVEAL_MS + DRAW_MS / 2);

    expect(host.querySelector('.tally__score')?.textContent).toContain('12');
    expect(host.querySelector('.tally__goal')?.textContent?.trim()).toBe('a série é sua');
    expect(voice()).toBe(pick(BLACKJACK_LINES.verdict.push));

    advance(1800);
    expect(voice()).toBe(pick(BLACKJACK_LINES.match.her));
    expect(button('Outra mão')).toBeNull();

    button('Nova série')!.click();
    fixture.detectChanges();
    expect(JSON.parse(localStorage.getItem(TALLY_KEY)!)).toEqual({ her: 0, gambit: 0 });
    expect(host.querySelector('.tally__goal')?.textContent).toContain('12 leva a mesa');
    expect(chipsCold()).toBe(true);
  });

  it('não deixa a mesa jogando sozinha depois de fechada', () => {
    dealHand();
    button('Parar')!.click();
    fixture.destroy();

    expect(() => vi.advanceTimersByTime(60_000)).not.toThrow();
  });
});
