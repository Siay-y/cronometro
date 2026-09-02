import { CountdownSnapshot } from '../models/countdown.model';

export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** Quebra uma duração em dias/horas/minutos/segundos, sem valores negativos. */
export function toCountdown(remainingMs: number): CountdownSnapshot {
  const totalMs = Math.max(0, remainingMs);

  return {
    totalMs,
    days: Math.floor(totalMs / DAY_MS),
    hours: Math.floor((totalMs % DAY_MS) / HOUR_MS),
    minutes: Math.floor((totalMs % HOUR_MS) / MINUTE_MS),
    seconds: Math.floor((totalMs % MINUTE_MS) / SECOND_MS),
    reached: totalMs === 0,
  };
}

/** `7` -> `"07"`. Mantém a largura das casas estável na animação dos dígitos. */
export function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Converte `AAAA-MM-DDTHH:mm` (hora local) em timestamp. */
export function parseLocalDateTime(value: string): number {
  return new Date(value).getTime();
}

/** Timestamp -> `AAAA-MM-DDTHH:mm`, pronto para um `<input type="datetime-local">`. */
export function toLocalDateTimeInput(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());

  return `${y}-${m}-${d}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Mantém um número dentro de um intervalo. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Duração curta e legível: "3d 04h", "4h 12min", "38s".
 * Usada nos mini-contadores dos cards.
 */
export function humanizeDuration(ms: number): string {
  const { days, hours, minutes, seconds } = toCountdown(ms);

  if (days > 0) return `${days}d ${pad2(hours)}h`;
  if (hours > 0) return `${hours}h ${pad2(minutes)}min`;
  if (minutes > 0) return `${minutes}min ${pad2(seconds)}s`;

  return `${seconds}s`;
}

/** "domingo, 15 de setembro às 00:00": o texto por extenso das datas. */
export function formatFullDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/** "15/09 · 00:00": versão compacta para os cards. */
export function formatShortDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const day = `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

  return `${day} · ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
