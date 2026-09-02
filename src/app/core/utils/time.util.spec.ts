import {
  DAY_MS,
  HOUR_MS,
  humanizeDuration,
  MINUTE_MS,
  pad2,
  toCountdown,
  toLocalDateTimeInput,
} from './time.util';

describe('toCountdown', () => {
  it('quebra a duração em dias, horas, minutos e segundos', () => {
    const snapshot = toCountdown(3 * DAY_MS + 4 * HOUR_MS + 5 * MINUTE_MS + 6000);

    expect(snapshot).toMatchObject({ days: 3, hours: 4, minutes: 5, seconds: 6, reached: false });
  });

  it('nunca fica negativo e marca a data como atingida', () => {
    const snapshot = toCountdown(-5000);

    expect(snapshot.totalMs).toBe(0);
    expect(snapshot.days).toBe(0);
    expect(snapshot.reached).toBe(true);
  });
});

describe('pad2', () => {
  it('mantém duas casas', () => {
    expect(pad2(7)).toBe('07');
    expect(pad2(42)).toBe('42');
  });
});

describe('humanizeDuration', () => {
  it('mostra apenas as duas maiores unidades relevantes', () => {
    expect(humanizeDuration(3 * DAY_MS + 4 * HOUR_MS)).toBe('3d 04h');
    expect(humanizeDuration(4 * HOUR_MS + 12 * MINUTE_MS)).toBe('4h 12min');
    expect(humanizeDuration(38_000)).toBe('38s');
  });
});

describe('toLocalDateTimeInput', () => {
  it('gera o formato aceito por <input type="datetime-local">', () => {
    const timestamp = new Date(2026, 8, 15, 0, 5).getTime();

    expect(toLocalDateTimeInput(timestamp)).toBe('2026-09-15T00:05');
  });
});
