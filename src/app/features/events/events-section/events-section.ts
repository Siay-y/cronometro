import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { GiftEventView } from '../../../core/models/gift-event.model';
import { CountdownService } from '../../../core/services/countdown.service';
import { GiftEventsStore } from '../../../core/state/gift-events.store';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { EventCard } from '../event-card/event-card';
import { EventReveal } from '../event-reveal/event-reveal';

/**
 * A Área de Eventos: a linha do tempo de presentes e o diálogo de revelação.
 *
 * Guardamos o *id* do presente selecionado (e não o objeto): assim a carta
 * aberta continua reagindo ao relógio enquanto está na tela.
 */
@Component({
  selector: 'app-events-section',
  imports: [EventCard, EventReveal, DurationPipe],
  templateUrl: './events-section.html',
  styleUrl: './events-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsSection {
  private readonly store = inject(GiftEventsStore);
  private readonly countdown = inject(CountdownService);
  private readonly selectedId = signal<string | null>(null);

  constructor() {
    // Nos últimos dez segundos o site fecha o que estiver aberto: a contagem
    // final e a detonação acontecem atrás do painel, e ela não pode perder isso
    // por estar relendo a carta das 23:00.
    effect(() => {
      if (this.countdown.stage() === 'final') this.close();
    });
  }

  protected readonly config = inject(CELEBRATION_CONFIG);
  protected readonly views = this.store.views;
  protected readonly nextToOpen = this.store.nextToOpen;
  protected readonly openedCount = this.store.openedCount;

  protected readonly selected = computed<GiftEventView | null>(
    () => this.views().find((view) => view.event.id === this.selectedId()) ?? null,
  );

  protected reveal(view: GiftEventView): void {
    this.selectedId.set(view.event.id);
    this.store.markOpened(view.event.id);
  }

  protected close(): void {
    this.selectedId.set(null);
  }
}
