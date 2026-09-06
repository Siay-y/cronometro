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
});
