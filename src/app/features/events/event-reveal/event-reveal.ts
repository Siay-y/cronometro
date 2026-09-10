import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { GiftEventView } from '../../../core/models/gift-event.model';
import { SchedulePipe } from '../../../shared/pipes/schedule.pipe';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';
import { LetterEnvelope } from '../letter-envelope/letter-envelope';

/** Um coração solto pelo botão "Merci". */
interface Heart {
  readonly id: number;
  /** Coordenadas na viewport, medidas no botão no momento do clique. */
  readonly x: number;
  readonly y: number;
  /** 1 a 5: cada variante sobe por um caminho diferente. */
  readonly variant: number;
  readonly size: number;
  readonly delay: number;
  readonly duration: number;
}

const HEARTS_PER_CLICK = 14;
/** Teto para quem ficar martelando o botão. */
const MAX_HEARTS = 90;
const HEART_VARIANTS = 5;

/**
 * A revelação de um presente.
 *
 * A entrada e a saída ficam a cargo do pai, via `animate.enter`/`animate.leave`
 * no próprio elemento. Aqui dentro cuidamos só do essencial de um diálogo:
 * foco, Escape e travar a rolagem do fundo.
 */
@Component({
  selector: 'app-event-reveal',
  imports: [SchedulePipe, PlayingCard, LetterEnvelope],
  templateUrl: './event-reveal.html',
  styleUrl: './event-reveal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'dismiss.emit()',
  },
})
export class EventReveal {
  readonly view = input.required<GiftEventView>();
  readonly dismiss = output<void>();

  protected readonly config = inject(CELEBRATION_CONFIG);
  private readonly destroyRef = inject(DestroyRef);
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  protected readonly event = computed(() => this.view().event);

  /** Cada linha em branco da mensagem vira um parágrafo. */
  protected readonly paragraphs = computed(() =>
    this.event()
      .message.split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );

  protected readonly hearts = signal<readonly Heart[]>([]);
  private nextHeartId = 0;

  /**
   * Solta um punhado de corações a partir do botão.
   *
   * A origem é medida no próprio elemento clicado, e não fixada no CSS, para
   * os corações saírem do botão onde quer que ele esteja na tela.
   */
  protected cheer(event: MouseEvent): void {
    const { left, top, width, height } = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();

    const batch = Array.from({ length: HEARTS_PER_CLICK }, () => ({
      id: this.nextHeartId++,
      x: left + width / 2,
      y: top + height / 2,
      variant: 1 + Math.floor(Math.random() * HEART_VARIANTS),
      size: 13 + Math.round(Math.random() * 18),
      delay: Math.round(Math.random() * 280),
      duration: 1500 + Math.round(Math.random() * 900),
    }));

    this.hearts.update((current) => [...current, ...batch].slice(-MAX_HEARTS));
  }

  /** Cada coração se remove ao fim da própria animação: sem timers. */
  protected retireHeart(id: number): void {
    this.hearts.update((current) => current.filter((heart) => heart.id !== id));
  }

  constructor() {
    afterNextRender(() => {
      this.closeButton()?.nativeElement.focus();

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.destroyRef.onDestroy(() => {
        document.body.style.overflow = previousOverflow;
      });
    });
  }
}
