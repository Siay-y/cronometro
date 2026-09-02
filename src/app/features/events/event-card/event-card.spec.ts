import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    expect(host.textContent).toContain('disponível');
    expect(revealed).toBe(true);
  });

  it('marca como lembrança depois que a janela fecha', () => {
    const host = render(OPENS_AT + 200 * MINUTE_MS, true);

    expect(host.textContent).toContain('lembrança guardada');
  });
});
