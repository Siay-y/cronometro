import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { vibrate } from '../../../core/utils/haptics.util';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';
import { SparkBurst } from '../../../shared/ui/spark-burst/spark-burst';

/** A batida da meia-noite: duas curtas e uma longa, quando o Ás sobe. */
const MIDNIGHT_PULSE = [60, 50, 60, 50, 160] as const;

/** O que substitui a contagem quando o relógio zera: a carta finalmente estoura. */
@Component({
  selector: 'app-birthday-reveal',
  imports: [PlayingCard, SparkBurst],
  templateUrl: './birthday-reveal.html',
  styleUrl: './birthday-reveal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BirthdayReveal {
  protected readonly config = inject(CELEBRATION_CONFIG);

  constructor() {
    afterNextRender(() => vibrate(MIDNIGHT_PULSE));
  }
}
