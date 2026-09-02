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
