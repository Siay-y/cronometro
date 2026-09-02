import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { GiftEventView } from '../../../core/models/gift-event.model';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { SchedulePipe } from '../../../shared/pipes/schedule.pipe';
import { Icon } from '../../../shared/ui/icon/icon';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';

/**
 * Um presente na linha do tempo.
 *
 * O card é "burro" de propósito: recebe a projeção pronta (`GiftEventView`) e
 * só avisa o pai quando ela quer abrir. Toda a regra de tempo fica na store.
 */
@Component({
  selector: 'app-event-card',
  imports: [PlayingCard, Icon, DurationPipe, SchedulePipe],
  templateUrl: './event-card.html',
  styleUrl: './event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"is-" + view().phase',
    '[class.accent-violet]': 'view().event.accent === "violet"',
    '[class.accent-gold]': 'view().event.accent === "gold"',
  },
})
export class EventCard {
  readonly view = input.required<GiftEventView>();
  readonly reveal = output<GiftEventView>();

  /** Recusa animada quando ela tenta abrir antes da hora. */
  protected readonly nudging = signal(false);

  protected readonly event = computed(() => this.view().event);
  protected readonly sealed = computed(() => this.view().phase === 'sealed');
  protected readonly live = computed(() => this.view().phase === 'live');
  protected readonly isNew = computed(() => !this.sealed() && !this.view().opened);

  /** Quanto da janela de destaque já passou; alimenta a barra do card. */
  protected readonly remainingRatio = computed(() => 1 - this.view().windowProgress);

  protected select(): void {
    if (this.sealed()) {
      this.nudging.set(true);
      return;
    }

    this.reveal.emit(this.view());
  }
}
