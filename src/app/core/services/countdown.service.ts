import { computed, inject, Injectable } from '@angular/core';
import { CELEBRATION_CONFIG } from '../config/celebration.config';
import { clamp, parseLocalDateTime, toCountdown } from '../utils/time.util';
import { ClockService } from './clock.service';

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

  /** 0 no início da jornada, 1 quando o dia chega; alimenta a "carga" visual. */
  readonly progress = computed(() => {
    const span = this.targetMs - this.startMs;
    if (span <= 0) return 1;

    return clamp((this.clock.now() - this.startMs) / span, 0, 1);
  });

  /** O relógio já está batendo no navegador? Enquanto não, mostramos o intro. */
  readonly ready = this.clock.live;
}
