import { GiftEvent } from '../models/gift-event.model';
import { describeGiftEvent } from './gift-event.util';
import { MINUTE_MS, parseLocalDateTime } from './time.util';

const EVENT: GiftEvent = {
  id: 'gift-test',
  title: 'Jantar',
  teaser: 'Separa a noite.',
  message: 'Vem cá.',
  icon: '🍷',
  accent: 'gold',
  opensAt: '2026-09-12T20:00',
  durationMinutes: 60,
};

const OPENS_AT = parseLocalDateTime(EVENT.opensAt);

describe('describeGiftEvent', () => {
  it('fica selado antes da hora', () => {
    const view = describeGiftEvent(EVENT, OPENS_AT - 30 * MINUTE_MS, false);

    expect(view.phase).toBe('sealed');
    expect(view.msUntilOpen).toBe(30 * MINUTE_MS);
    expect(view.msRemaining).toBe(0);
  });

  it('destrava exatamente no horário de abertura', () => {
    expect(describeGiftEvent(EVENT, OPENS_AT, false).phase).toBe('live');
  });

  it('conta o tempo restante dentro da janela', () => {
    const view = describeGiftEvent(EVENT, OPENS_AT + 15 * MINUTE_MS, false);

    expect(view.phase).toBe('live');
    expect(view.msRemaining).toBe(45 * MINUTE_MS);
    expect(view.windowProgress).toBeCloseTo(0.25);
  });

  it('vira lembrança quando a janela termina', () => {
    const view = describeGiftEvent(EVENT, OPENS_AT + 61 * MINUTE_MS, true);

    expect(view.phase).toBe('memory');
    expect(view.windowProgress).toBe(1);
    expect(view.opened).toBe(true);
  });
});
