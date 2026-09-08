import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { CountdownService } from '../../../core/services/countdown.service';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';
import { SchedulePipe } from '../../../shared/pipes/schedule.pipe';
import { TimeUnit } from '../time-unit/time-unit';

/** O topo da página: a carta que se carrega e a contagem regressiva. */
@Component({
  selector: 'app-countdown-hero',
  imports: [TimeUnit, PlayingCard, SchedulePipe],
  templateUrl: './countdown-hero.html',
  styleUrl: './countdown-hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownHero {
  private readonly countdown = inject(CountdownService);

  protected readonly config = inject(CELEBRATION_CONFIG);
  protected readonly snapshot = this.countdown.snapshot;
  protected readonly progress = this.countdown.progress;
  protected readonly targetMs = this.countdown.targetMs;

  protected readonly chargePercent = computed(() => Math.round(this.progress() * 100));

  private readonly cardRef = viewChild('card', { read: ElementRef });

  /** A carta em si, para o cabeçalho saber de onde arremessá-la. */
  readonly cardElement = computed<HTMLElement | null>(
    () => this.cardRef()?.nativeElement ?? null,
  );
}
