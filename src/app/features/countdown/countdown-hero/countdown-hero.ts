import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { CountdownStage } from '../../../core/models/countdown.model';
import { CountdownService } from '../../../core/services/countdown.service';
import { vibrate } from '../../../core/utils/haptics.util';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';
import { SchedulePipe } from '../../../shared/pipes/schedule.pipe';
import { TimeUnit } from '../time-unit/time-unit';

/** A etiqueta acima do título muda de tom conforme o dia se aproxima. */
const EYEBROW: Record<CountdownStage, string> = {
  journey: 'Contagem regressiva',
  eve: 'É amanhã',
  'last-hour': 'Falta menos de uma hora',
  final: 'É agora',
  arrived: 'Enfim',
};

/** O que ele diz estar esperando, no mesmo compasso da etiqueta. */
const WAITING_FOR: Record<CountdownStage, string> = {
  journey: 'Eu só preciso esperar até o dia 15.',
  eve: 'Eu só preciso esperar até a meia-noite.',
  'last-hour': 'Eu só preciso esperar mais um pouquinho.',
  final: 'Eu só preciso esperar mais um pouquinho.',
  arrived: '',
};

/** A batida de cada segundo da contagem final: mais forte conforme chega. */
const FINAL_TICK_MS = 28;
const FINAL_TICK_GROWTH_MS = 7;

/**
 * O topo da página: a carta que se carrega e a contagem regressiva.
 *
 * Na véspera a página muda de humor: o dia some do relógio, a energia passa a
 * transbordar e, na última hora, a carta começa a tremer. Nos últimos dez
 * segundos a contagem toma a tela inteira, um número por vez, até a carta
 * detonar à meia-noite (a saída é o `animate.leave` do pai).
 */
@Component({
  selector: 'app-countdown-hero',
  imports: [TimeUnit, PlayingCard, SchedulePipe],
  templateUrl: './countdown-hero.html',
  styleUrl: './countdown-hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-eve]': 'eve()',
    '[class.is-last-hour]': 'lastHour()',
  },
})
export class CountdownHero {
  private readonly countdown = inject(CountdownService);

  protected readonly config = inject(CELEBRATION_CONFIG);
  protected readonly snapshot = this.countdown.snapshot;
  protected readonly progress = this.countdown.progress;
  protected readonly targetMs = this.countdown.targetMs;
  protected readonly heat = this.countdown.heat;

  private readonly stage = this.countdown.stage;

  /** Menos de um dia: o relógio perde a casa dos dias e a energia transborda. */
  protected readonly eve = computed(() => this.stage() !== 'journey');
  /** A última hora: a carta treme cada vez mais. */
  protected readonly lastHour = computed(
    () => this.stage() === 'last-hour' || this.stage() === 'final',
  );
  /** Os últimos segundos, contados em voz alta na tela inteira. */
  protected readonly final = computed(() => this.stage() === 'final');

  protected readonly eyebrow = computed(() => EYEBROW[this.stage()]);
  protected readonly waitingFor = computed(() => WAITING_FOR[this.stage()]);

  protected readonly chargePercent = computed(() => Math.round(this.progress() * 100));

  private readonly cardRef = viewChild('card', { read: ElementRef });

  /** A carta em si, para o cabeçalho saber de onde arremessá-la. */
  readonly cardElement = computed<HTMLElement | null>(() => this.cardRef()?.nativeElement ?? null);

  constructor() {
    // Cada segundo da contagem final bate no celular dela, um pouco mais forte
    // que o anterior. Lê os segundos primeiro para acordar a cada virada.
    effect(() => {
      const { seconds } = this.snapshot();
      if (!this.final()) return;

      vibrate(FINAL_TICK_MS + (10 - Math.min(seconds, 10)) * FINAL_TICK_GROWTH_MS);
    });
  }
}
