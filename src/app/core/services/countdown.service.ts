import { computed, inject, Injectable } from '@angular/core';
import { CELEBRATION_CONFIG } from '../config/celebration.config';
import { CountdownStage } from '../models/countdown.model';
import { clamp, HOUR_MS, parseLocalDateTime, toCountdown } from '../utils/time.util';
import { ClockService } from './clock.service';

/** Os últimos segundos, contados um a um na tela. */
export const FINAL_COUNT_MS = 10_000;

/**
 * Contagem regressiva até o aniversário, derivada do relógio.
 * É tudo `computed`: nenhum estado próprio, nenhuma subscrição para limpar.
 */
@Injectable({ providedIn: 'root' })
export class CountdownService {
  private readonly clock = inject(ClockService);
  private readonly config = inject(CELEBRATION_CONFIG);

  readonly targetMs = parseLocalDateTime(this.config.birthdayAt);
  private readonly startMs = parseLocalDateTime(this.config.journeyStartsAt);

  readonly snapshot = computed(() => toCountdown(this.targetMs - this.clock.now()));

  /** `true` a partir da meia-noite do aniversário. */
  readonly arrived = computed(() => this.snapshot().reached);

  /** Em que pé a espera está: é o que muda o humor da página na reta final. */
  readonly stage = computed<CountdownStage>(() => {
    const { reached, days, hours, totalMs } = this.snapshot();

    if (reached) return 'arrived';
    if (days > 0) return 'journey';
    if (hours > 0) return 'eve';

    return totalMs > FINAL_COUNT_MS ? 'last-hour' : 'final';
  });

  /**
   * Quanto a última hora já esquentou: 0 às 23:00, 1 à meia-noite. Fora dela,
   * zero. Alimenta o tremor da carta enquanto ela espera o relógio virar.
   */
  readonly heat = computed(() => {
    const { totalMs } = this.snapshot();
    if (totalMs === 0 || totalMs > HOUR_MS) return 0;

    return 1 - totalMs / HOUR_MS;
  });

  /** 0 no início da jornada, 1 quando o dia chega; alimenta a "carga" visual. */
  readonly progress = computed(() => {
    const span = this.targetMs - this.startMs;
    if (span <= 0) return 1;

    return clamp((this.clock.now() - this.startMs) / span, 0, 1);
  });

  /** O relógio já está batendo no navegador? Enquanto não, mostramos o intro. */
  readonly ready = this.clock.live;
}
