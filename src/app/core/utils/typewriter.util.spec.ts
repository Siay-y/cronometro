import { keystrokeDelay, typingDuration } from './typewriter.util';

describe('typewriter.util', () => {
  it('hesita um pouco diferente a cada tecla, mas sempre do mesmo jeito', () => {
    const text = 'abcdef';
    const first = [0, 1, 2, 3, 4, 5].map((index) => keystrokeDelay(text, index));

    // Nunca abaixo do tempo de uma tecla, nunca uma pausa de pontuação.
    for (const delay of first) {
      expect(delay).toBeGreaterThanOrEqual(26);
      expect(delay).toBeLessThan(100);
    }
    expect(new Set(first).size).toBeGreaterThan(1);
    expect([0, 1, 2, 3, 4, 5].map((index) => keystrokeDelay(text, index))).toEqual(first);
  });

  it('para na vírgula e respira no ponto', () => {
    expect(keystrokeDelay('a, b. c', 1)).toBe(180);
    expect(keystrokeDelay('a, b. c', 4)).toBe(420);
    expect(keystrokeDelay('Vem cá!', 6)).toBe(420);
  });

  it('soma o tempo do texto inteiro', () => {
    expect(typingDuration('')).toBe(0);
    expect(typingDuration('a.')).toBe(keystrokeDelay('a.', 0) + 420);
  });
});
