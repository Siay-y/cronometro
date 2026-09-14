/** Fotografia da contagem regressiva em um instante, sempre não-negativa. */
export interface CountdownSnapshot {
  /** Milissegundos restantes até o alvo (0 quando a data já chegou). */
  readonly totalMs: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  /** `true` a partir do instante em que a data alvo é atingida. */
  readonly reached: boolean;
}

/**
 * Em que pé a espera está. A interface muda de humor conforme o dia chega:
 * - `journey`: ainda faltam dias;
 * - `eve`: é amanhã (menos de 24 horas);
 * - `last-hour`: menos de uma hora;
 * - `final`: os últimos segundos, a contagem em voz alta;
 * - `arrived`: chegou.
 */
export type CountdownStage = 'journey' | 'eve' | 'last-hour' | 'final' | 'arrived';
