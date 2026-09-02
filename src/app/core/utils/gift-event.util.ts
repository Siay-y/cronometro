import { GiftEvent, GiftEventPhase, GiftEventView } from '../models/gift-event.model';
import { clamp, MINUTE_MS, parseLocalDateTime } from './time.util';

/** Ordena por horário de abertura: a linha do tempo da Área de Eventos. */
export function byOpensAt(a: GiftEvent, b: GiftEvent): number {
  return parseLocalDateTime(a.opensAt) - parseLocalDateTime(b.opensAt);
}

/**
 * Projeta um presente no instante `now`. Função pura: mesma entrada, mesma
 * saída. É isso que torna o comportamento trivial de testar e de simular com a
 * viagem no tempo do painel.
 */
export function describeGiftEvent(event: GiftEvent, now: number, opened: boolean): GiftEventView {
  const opensAtMs = parseLocalDateTime(event.opensAt);
  const closesAtMs = opensAtMs + Math.max(1, event.durationMinutes) * MINUTE_MS;

  const phase: GiftEventPhase = now < opensAtMs ? 'sealed' : now < closesAtMs ? 'live' : 'memory';

  return {
    event,
    phase,
    opensAtMs,
    closesAtMs,
    msUntilOpen: Math.max(0, opensAtMs - now),
    msRemaining: phase === 'live' ? closesAtMs - now : 0,
    windowProgress: clamp((now - opensAtMs) / (closesAtMs - opensAtMs), 0, 1),
    opened,
  };
}
