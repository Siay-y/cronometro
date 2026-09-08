import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GiftEvent } from '../../../core/models/gift-event.model';
import { describeGiftEvent } from '../../../core/utils/gift-event.util';
import { MINUTE_MS, parseLocalDateTime } from '../../../core/utils/time.util';
import { EventCard } from './event-card';

const EVENT: GiftEvent = {
  id: 'gift-test',
  title: 'Sessão da noite',
  teaser: 'Você escolhe o filme.',
  message: 'Hoje a tela é sua.',
  icon: '🎬',
  accent: 'violet',
  opensAt: '2026-09-08T21:00',
  durationMinutes: 120,
};

const OPENS_AT = parseLocalDateTime(EVENT.opensAt);

describe('EventCard', () => {
  let fixture: ComponentFixture<EventCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EventCard] }).compileComponents();
    fixture = TestBed.createComponent(EventCard);
  });

  function render(now: number, opened = false): HTMLElement {
    fixture.componentRef.setInput('view', describeGiftEvent(EVENT, now, opened));
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('esconde o título enquanto a carta está selada', () => {
    const host = render(OPENS_AT - 60 * MINUTE_MS);

    expect(host.textContent).toContain('???');
    expect(host.textContent).not.toContain('Sessão da noite');
    expect(host.textContent).toContain('abre em');
  });

  it('não deixa abrir antes da hora', () => {
    render(OPENS_AT - 60 * MINUTE_MS);
    let revealed = false;
    fixture.componentInstance.reveal.subscribe(() => (revealed = true));

    fixture.nativeElement.querySelector('button').click();

    expect(revealed).toBe(false);
  });

  it('revela o título e libera a abertura dentro da janela', () => {
    const host = render(OPENS_AT + 10 * MINUTE_MS);
    let revealed = false;
    fixture.componentInstance.reveal.subscribe(() => (revealed = true));

    host.querySelector('button')!.click();

    expect(host.textContent).toContain('Sessão da noite');
    // Carta disponível e ainda fechada convida a carregar, não a tocar.
    expect(host.textContent).toContain('segure para carregar');
    expect(revealed).toBe(true);
  });

  it('marca como lembrança depois que a janela fecha', () => {
    const host = render(OPENS_AT + 200 * MINUTE_MS, true);

    expect(host.textContent).toContain('lembrança guardada');
  });
});

describe('EventCard: carga cinética', () => {
  const CHARGE_MS = 1200;
  let fixture: ComponentFixture<EventCard>;
  let host: HTMLElement;
  let revelations: number;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [EventCard] }).compileComponents();

    fixture = TestBed.createComponent(EventCard);
    revelations = 0;
    fixture.componentInstance.reveal.subscribe(() => revelations++);
  });

  afterEach(() => vi.useRealTimers());

  /** `opened: false` = primeira abertura, que é a que pede a carga. */
  function render(opened: boolean): HTMLElement {
    fixture.componentRef.setInput(
      'view',
      describeGiftEvent(EVENT, OPENS_AT + 10 * MINUTE_MS, opened),
    );
    fixture.detectChanges();

    return (host = fixture.nativeElement as HTMLElement);
  }

  function fire(type: string): void {
    host.querySelector('button')!.dispatchEvent(new Event(type));
    fixture.detectChanges();
  }

  it('pede a carga na primeira abertura', () => {
    render(false);

    expect(host.textContent).toContain('segure para carregar');
    expect(host.querySelector('.ring')).toBeTruthy();
  });

  it('acende o anel enquanto o dedo está na tela', () => {
    render(false);
    fire('pointerdown');

    expect(host.classList.contains('is-charging')).toBe(true);
    expect(revelations).toBe(0);
  });

  it('descarrega se ela soltar antes da hora', () => {
    render(false);
    fire('pointerdown');
    vi.advanceTimersByTime(CHARGE_MS - 200);
    fire('pointerup');

    expect(host.classList.contains('is-charging')).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(revelations).toBe(0);
  });

  it('cancela quando a rolagem rouba o toque', () => {
    render(false);
    fire('pointerdown');
    fire('pointercancel');
    vi.advanceTimersByTime(2000);

    expect(revelations).toBe(0);
  });

  it('detona quando a carga completa', () => {
    render(false);
    fire('pointerdown');
    vi.advanceTimersByTime(CHARGE_MS);
    fixture.detectChanges();

    expect(revelations).toBe(1);
    expect(host.classList.contains('is-detonating')).toBe(true);
    expect(host.classList.contains('is-charging')).toBe(false);
  });

  it('não abre no toque rápido, só no segurar', () => {
    render(false);
    fire('pointerdown');
    fire('pointerup');
    fire('click');

    expect(revelations).toBe(0);
  });

  it('não abre duas vezes quando o clique chega depois do dedo soltar', () => {
    render(false);
    fire('pointerdown');
    vi.advanceTimersByTime(CHARGE_MS);
    fire('pointerup');
    fire('click');

    expect(revelations).toBe(1);
  });

  it('volta a abrir no toque simples depois de já ter sido aberta', () => {
    render(true);

    expect(host.querySelector('.ring')).toBeNull();
    expect(host.textContent).not.toContain('segure para carregar');

    fire('pointerdown');
    fire('click');

    expect(revelations).toBe(1);
  });

  it('abre direto pelo teclado, sem precisar segurar', () => {
    render(false);
    // Enter e Espaço disparam `click` sem nenhum `pointerdown` antes.
    fire('click');

    expect(revelations).toBe(1);
  });
});
