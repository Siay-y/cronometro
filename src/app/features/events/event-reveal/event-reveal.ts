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
  viewChild,
} from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { GiftEventView } from '../../../core/models/gift-event.model';
import { SchedulePipe } from '../../../shared/pipes/schedule.pipe';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';

/**
 * A revelação de um presente.
 *
 * A entrada e a saída ficam a cargo do pai, via `animate.enter`/`animate.leave`
 * no próprio elemento. Aqui dentro cuidamos só do essencial de um diálogo:
 * foco, Escape e travar a rolagem do fundo.
 */
@Component({
  selector: 'app-event-reveal',
  imports: [SchedulePipe, PlayingCard],
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
