import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CardTrick } from './card-trick';

const CHARGE_MS = 1200;
const SHUFFLE_MS = 1150;

describe('CardTrick', () => {
  let fixture: ComponentFixture<CardTrick>;
  let host: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({ imports: [CardTrick] }).compileComponents();

    fixture = TestBed.createComponent(CardTrick);
    fixture.detectChanges();
    fixture.detectChanges();

    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => vi.useRealTimers());

  /** As cartas na mesa, pelo rótulo que o leitor de tela anuncia. */
  function table(): string[] {
    return [...host.querySelectorAll('app-playing-card')].map(
      (card) => card.getAttribute('aria-label') ?? '',
    );
  }

  function deck(): HTMLElement {
    return host.querySelector('.fan') as HTMLElement;
  }

  function hold(ms: number): void {
    deck().dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(ms);
    fixture.detectChanges();
  }

  /** Segura até detonar e espera o giro inteiro terminar. */
  function playTheTrick(): void {
    hold(CHARGE_MS);
    vi.advanceTimersByTime(SHUFFLE_MS);
    fixture.detectChanges();
  }

  it('põe cinco cartas na mesa e pede que ela guarde uma', () => {
    expect(table().length).toBe(5);
    expect(host.textContent).toContain('guarde ela só para você');
    expect(host.textContent).toContain('segure o baralho');
  });

  it('faz sumir a carta dela: nenhuma das que voltam estava na mesa', () => {
    const before = table();

    playTheTrick();
    const after = table();

    expect(after.length).toBe(4);
    // O coração do truque. Qualquer uma das cinco que ela tenha guardado, essa
    // é a carta que sumiu.
    for (const card of after) expect(before).not.toContain(card);
  });

  it('vira as cartas de costas durante o giro, para a troca não ser vista', () => {
    hold(CHARGE_MS);

    const faceDown = host.querySelectorAll('app-playing-card.is-face-down');

    expect(faceDown.length).toBe(table().length);
    // A mensagem só vem depois que as cartas pousam.
    expect(host.textContent).not.toContain('A sua sumiu');
  });

  it('só troca a mão com as cartas já de costas', () => {
    // Meio segundo de giro: ainda são cinco cartas, todas viradas.
    hold(CHARGE_MS);
    vi.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(table().length).toBe(5);
    expect(host.querySelectorAll('app-playing-card.is-face-down').length).toBe(5);
  });

  it('conta a piada só no fim, quando as quatro pousam', () => {
    playTheTrick();

    expect(host.textContent).toContain('A sua sumiu, non?');
    expect(host.textContent).toContain('do lado do coração');
    expect(host.querySelector('[role="status"]')).toBeTruthy();
  });

  it('descarrega o baralho se ela soltar antes da hora', () => {
    hold(CHARGE_MS - 200);
    deck().dispatchEvent(new Event('pointerup'));
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    // Nada aconteceu: as mesmas cinco cartas continuam na mesa.
    expect(table().length).toBe(5);
    expect(host.textContent).not.toContain('A sua sumiu');
  });

  it('não repete o embaralho quando o clique chega depois do dedo', () => {
    playTheTrick();
    // No navegador o `click` vem logo atrás do `pointerdown`; ele não pode
    // disparar um segundo truque por cima do primeiro.
    deck().click();
    fixture.detectChanges();

    expect(table().length).toBe(4);
  });

  it('embaralha direto pelo teclado, sem precisar segurar nada', () => {
    // Enter e Espaço disparam `click` sem nenhum `pointerdown` antes.
    deck().click();
    vi.advanceTimersByTime(SHUFFLE_MS);
    fixture.detectChanges();

    expect(table().length).toBe(4);
  });

  it('devolve cinco cartas novas quando ela pede outra rodada', () => {
    playTheTrick();
    const gone = table();

    (host.querySelector('.verdict button') as HTMLElement).click();
    fixture.detectChanges();

    const fresh = table();

    expect(fresh.length).toBe(5);
    expect(host.textContent).not.toContain('A sua sumiu');
    // Mão nova, e não as quatro de antes recolocadas na mesa.
    expect(fresh.slice(0, 4).join()).not.toBe(gone.join());
  });

  it('espalha as cartas em leque, cada uma com o seu ângulo e atraso', () => {
    const slots = [...host.querySelectorAll<HTMLElement>('.fan__slot')];
    const cards = [...host.querySelectorAll<HTMLElement>('.fan__card')];

    // A do meio fica reta; as pontas abrem para os dois lados.
    // (O CSSOM devolve o ângulo já normalizado, sem a casa decimal.)
    expect(slots[2].style.rotate).toBe('0deg');
    expect(slots[0].style.rotate).toBe('-16deg');
    expect(slots[4].style.rotate).toBe('16deg');
    // O giro entra em onda, uma carta depois da outra.
    expect(cards[0].style.animationDelay).toBe('0ms');
    expect(cards[4].style.animationDelay).toBe('220ms');
  });

  it('não deixa temporizador solto quando some da tela no meio do truque', () => {
    hold(CHARGE_MS);
    fixture.destroy();

    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
  });
});
