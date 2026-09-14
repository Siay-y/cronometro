import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GiftEvent } from '../../../core/models/gift-event.model';
import { GiftEventsStore } from '../../../core/state/gift-events.store';
import { describeGiftEvent } from '../../../core/utils/gift-event.util';
import { parseLocalDateTime } from '../../../core/utils/time.util';
import { keystrokeDelay, typingDuration } from '../../../core/utils/typewriter.util';
import { installFakeCanvas } from '../../../../testing/fake-canvas';
import { EventReveal } from './event-reveal';

const EVENT: GiftEvent = {
  id: 'gift-test',
  title: 'Tem algo te esperando na Steam',
  teaser: 'Abre a sua Steam.',
  message: 'Primeiro parágrafo.\n\nSegundo parágrafo.',
  icon: '🕹️',
  accent: 'magenta',
  opensAt: '2026-09-06T10:30',
  durationMinutes: 2880,
};

describe('EventReveal', () => {
  let fixture: ComponentFixture<EventReveal>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EventReveal] }).compileComponents();

    fixture = TestBed.createComponent(EventReveal);
    fixture.componentRef.setInput(
      'view',
      describeGiftEvent(EVENT, parseLocalDateTime(EVENT.opensAt) + 60_000, false),
    );
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  function thanksButton(): HTMLButtonElement {
    return host.querySelector('.thanks')!;
  }

  function hearts(): NodeListOf<HTMLElement> {
    return host.querySelectorAll('.heart');
  }

  it('mostra a mensagem quebrada em parágrafos', () => {
    expect(host.querySelectorAll('.panel__message p').length).toBe(2);
  });

  it('põe o botão à esquerda da assinatura', () => {
    const foot = host.querySelector('.panel__foot')!;

    expect(foot.firstElementChild).toBe(thanksButton());
    expect(thanksButton().textContent?.trim()).toBe('Merci :>');
    expect(foot.querySelector('.panel__sign')).toBeTruthy();
  });

  it('não mostra envelope nenhum num presente sem carta', () => {
    expect(host.querySelector('app-letter-envelope')).toBeNull();
  });

  it('guarda o envelope entre a mensagem e a assinatura quando o presente tem carta', () => {
    fixture.componentRef.setInput(
      'view',
      describeGiftEvent(
        {
          ...EVENT,
          letter: { cta: 'Abrir a carta', body: 'Oi.', closing: 'Teu,', signature: 'Gambit' },
        },
        parseLocalDateTime(EVENT.opensAt) + 60_000,
        false,
      ),
    );
    fixture.detectChanges();

    const envelope = host.querySelector('app-letter-envelope');

    expect(envelope).toBeTruthy();
    expect(envelope!.previousElementSibling?.classList.contains('panel__message')).toBe(true);
    expect(envelope!.nextElementSibling?.classList.contains('panel__foot')).toBe(true);
    // A carta já se assina por dentro: o painel não repete a despedida.
    expect(host.querySelector('.panel__sign')).toBeNull();
    expect(host.querySelector('.panel__foot--solo')).toBeTruthy();
  });

  it('não solta coração nenhum antes do clique', () => {
    expect(hearts().length).toBe(0);
  });

  it('solta um punhado de corações a cada clique', () => {
    thanksButton().click();
    fixture.detectChanges();

    expect(hearts().length).toBe(14);
  });

  it('mantém os corações fora do painel, que rola', () => {
    thanksButton().click();
    fixture.detectChanges();

    expect(host.querySelector('.panel .heart')).toBeNull();
    expect(host.querySelector('.hearts .heart')).toBeTruthy();
  });

  it('recolhe cada coração quando a animação dele termina', () => {
    thanksButton().click();
    fixture.detectChanges();

    hearts()[0].dispatchEvent(new Event('animationend'));
    fixture.detectChanges();

    expect(hearts().length).toBe(13);
  });

  it('não deixa a festa crescer sem limite se o botão for martelado', () => {
    for (let click = 0; click < 12; click++) thanksButton().click();
    fixture.detectChanges();

    expect(hearts().length).toBe(90);
  });

  it('não põe porta-retratos nenhum num presente sem foto', () => {
    expect(host.querySelector('app-photo-frame')).toBeNull();
  });

  it('acomoda a foto do fim logo depois do último parágrafo', () => {
    fixture.componentRef.setInput(
      'view',
      describeGiftEvent(
        {
          ...EVENT,
          message: 'Primeiro.\n\nSegundo.\n\nTerceiro.',
          photo: { src: '/fotos/final.jpg', alt: 'Nós', caption: 'te amo' },
        },
        parseLocalDateTime(EVENT.opensAt) + 60_000,
        false,
      ),
    );
    fixture.detectChanges();

    const frame = host.querySelector<HTMLElement>('app-photo-frame')!;

    expect(frame).toBeTruthy();
    expect(frame.previousElementSibling?.classList.contains('panel__message')).toBe(true);
    expect(frame.querySelector('img')?.getAttribute('src')).toBe('/fotos/final.jpg');
    expect(frame.textContent).toContain('te amo');
    // O terceiro parágrafo entra aos 400ms; a foto, um compasso depois.
    expect(frame.style.animationDelay).toBe('920ms');
  });

  it('nos outros presentes, a carta de estrela com o emblema, sem estouro', () => {
    expect(host.classList.contains('is-finale')).toBe(false);
    expect(host.querySelector('app-spark-burst')).toBeNull();
    expect(host.querySelector('.panel__card')?.getAttribute('aria-label')).toBe('Carta ★ de ♦');
    expect(host.querySelector('.hand')).toBeNull();
  });
});

describe('EventReveal: o presente principal', () => {
  const FIRST = 'Feliz aniversário.';
  const LAST = 'Vem cá.';
  const TYPING_START_MS = 900;
  const FINALE_PAUSE_MS = 1400;

  let fixture: ComponentFixture<EventReveal>;
  let host: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    // Com um canvas de mentira a raspadinha fica por cima da foto; sem canvas
    // ela se revelaria sozinha no primeiro render.
    installFakeCanvas();

    await TestBed.configureTestingModule({ imports: [EventReveal] }).compileComponents();
    TestBed.inject(GiftEventsStore).restoreDefaults();

    fixture = TestBed.createComponent(EventReveal);
    fixture.componentRef.setInput(
      'view',
      describeGiftEvent(
        {
          ...EVENT,
          // O mesmo id do presente principal da lista: ele não entra no leque.
          id: 'gift-08',
          finale: true,
          message: `${FIRST}\n\n${LAST}`,
          photo: { src: '/fotos/final.jpg', alt: 'Nós', caption: 'te amo', foil: true },
        },
        parseLocalDateTime('2026-09-15T00:06'),
        false,
      ),
    );
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

  function lines(): string[] {
    return [...host.querySelectorAll('.panel__message p')].map((p) => p.textContent?.trim() ?? '');
  }

  it('abre dourado, com o Ás no meio do estouro de naipes', () => {
    expect(host.classList.contains('is-finale')).toBe(true);
    expect(host.querySelector('app-spark-burst .panel__card')).toBeTruthy();
    expect(host.querySelector('.panel__card')?.getAttribute('aria-label')).toBe('Carta A de ♥');
    // O estouro fica curto de propósito: o painel rola, e cortaria o resto.
    expect(host.querySelector('app-spark-burst')?.classList.contains('is-tight')).toBe(true);
  });

  it('põe todas as outras cartas da mesa num leque atrás do Ás', () => {
    const others = TestBed.inject(GiftEventsStore)
      .events()
      .filter((event) => event.id !== 'gift-08');
    const cards = [...host.querySelectorAll<HTMLElement>('.hand__card')];

    expect(cards.length).toBe(others.length);
    expect(cards.map((card) => card.dataset['hand'])).toEqual(others.map((event) => event.id));
    // O emblema de cada carta é o ícone do baralho dela, desenhado, não um emoji.
    expect(cards[0].querySelector('.center app-icon svg')).toBeTruthy();
    // Sem `animate` (o jsdom não tem), a carta já nasce pousada no leque.
    expect(cards.every((card) => card.classList.contains('is-landed'))).toBe(true);
  });

  it('escreve a mensagem ao vivo, tecla por tecla', () => {
    // Antes de a mão começar: o primeiro parágrafo existe, vazio, com o cursor.
    expect(lines()).toEqual(['']);
    expect(host.querySelector('.is-writing')).toBeTruthy();

    advance(TYPING_START_MS);
    expect(lines()).toEqual(['F']);

    advance(keystrokeDelay(FIRST, 0));
    expect(lines()).toEqual(['Fe']);

    advance(typingDuration(FIRST));
    expect(lines()[0]).toBe(FIRST);
  });

  it('segura o "Vem cá." numa pausa longa e o escreve por último', () => {
    advance(TYPING_START_MS + typingDuration(FIRST));
    // O primeiro parágrafo terminou; o último ainda nem apareceu.
    expect(lines()).toEqual([FIRST]);
    expect(host.querySelector('app-photo-frame')).toBeNull();

    advance(FINALE_PAUSE_MS);
    expect(lines()).toEqual([FIRST, 'V']);
    expect(host.querySelector('.is-finale-last')?.classList.contains('is-writing')).toBe(true);

    advance(typingDuration(LAST));
    expect(lines()).toEqual([FIRST, LAST]);
    // Terminou: o cursor some e a foto chega, coberta pela raspadinha.
    expect(host.querySelector('.is-writing')).toBeNull();
    expect(host.querySelector('app-photo-frame')).toBeTruthy();
    expect(host.querySelector('app-photo-frame app-scratch-foil')).toBeTruthy();
  });

  it('entrega a mensagem pronta a quem pediu menos movimento', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const quick = TestBed.createComponent(EventReveal);
    quick.componentRef.setInput(
      'view',
      describeGiftEvent(
        { ...EVENT, finale: true, message: `${FIRST}\n\n${LAST}` },
        parseLocalDateTime(EVENT.opensAt) + 60_000,
        false,
      ),
    );
    quick.detectChanges();

    const text = [...quick.nativeElement.querySelectorAll('.panel__message p')].map((p: Element) =>
      p.textContent?.trim(),
    );

    expect(text).toEqual([FIRST, LAST]);
    vi.unstubAllGlobals();
  });

  it('não deixa a máquina de escrever rodando depois de fechada', () => {
    advance(TYPING_START_MS);
    fixture.destroy();

    expect(() => vi.advanceTimersByTime(60_000)).not.toThrow();
  });
});
