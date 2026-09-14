import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GiftEvent } from '../../../core/models/gift-event.model';
import { describeGiftEvent } from '../../../core/utils/gift-event.util';
import { parseLocalDateTime } from '../../../core/utils/time.util';
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

  describe('o presente principal', () => {
    beforeEach(() => {
      fixture.componentRef.setInput(
        'view',
        describeGiftEvent(
          { ...EVENT, finale: true, message: 'Feliz aniversário.\n\nVem cá.' },
          parseLocalDateTime(EVENT.opensAt) + 60_000,
          false,
        ),
      );
      fixture.detectChanges();
    });

    it('abre dourado, com o Ás no meio do estouro de naipes', () => {
      expect(host.classList.contains('is-finale')).toBe(true);
      expect(host.querySelector('app-spark-burst .panel__card')).toBeTruthy();
      expect(host.querySelector('.panel__card')?.getAttribute('aria-label')).toBe('Carta A de ♥');
      // O estouro fica curto de propósito: o painel rola, e cortaria o resto.
      expect(host.querySelector('app-spark-burst')?.classList.contains('is-tight')).toBe(true);
    });

    it('segura a última frase para ela chegar sozinha', () => {
      const [first, last] = [...host.querySelectorAll<HTMLElement>('.panel__message p')];

      expect(first.style.animationDelay).toBe('120ms');
      expect(first.classList.contains('is-finale-last')).toBe(false);
      // 120 + 140, e mais a pausa de 1400.
      expect(last.style.animationDelay).toBe('1660ms');
      expect(last.classList.contains('is-finale-last')).toBe(true);
      expect(last.textContent?.trim()).toBe('Vem cá.');
    });
  });

  it('nos outros presentes, a carta de estrela com o emblema, sem estouro', () => {
    expect(host.classList.contains('is-finale')).toBe(false);
    expect(host.querySelector('app-spark-burst')).toBeNull();
    expect(host.querySelector('.panel__card')?.getAttribute('aria-label')).toBe('Carta ★ de ♦');
  });
});
