import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CELEBRATION_CONFIG } from '../../core/config/celebration.config';
import { CountdownService } from '../../core/services/countdown.service';
import { KineticBackdrop } from '../../shared/ui/kinetic-backdrop/kinetic-backdrop';
import { PlayingCard } from '../../shared/ui/playing-card/playing-card';
import { AdminPanel } from '../admin/admin-panel/admin-panel';
import { BirthdayReveal } from '../celebration/birthday-reveal/birthday-reveal';
import { CountdownHero } from '../countdown/countdown-hero/countdown-hero';
import { EventsSection } from '../events/events-section/events-section';

/** Toques necessários no naipe do rodapé para revelar o painel. */
const SECRET_TAPS = 5;
const SECRET_WINDOW_MS = 2500;

/**
 * A página. Orquestra as seções e decide o que mostrar:
 * o intro (enquanto o relógio não começa a bater), a contagem ou a festa.
 */
@Component({
  selector: 'app-home',
  imports: [KineticBackdrop, PlayingCard, CountdownHero, BirthdayReveal, EventsSection, AdminPanel],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly countdown = inject(CountdownService);

  protected readonly config = inject(CELEBRATION_CONFIG);
  protected readonly ready = this.countdown.ready;
  protected readonly arrived = this.countdown.arrived;
  protected readonly progress = this.countdown.progress;

  protected readonly panelOpen = signal(false);

  private taps = 0;
  private lastTapAt = 0;

  constructor() {
    // Atalho para quem já sabe o caminho: /?painel
    const hasQueryParam = inject(ActivatedRoute).snapshot.queryParamMap.has('painel');
    if (hasQueryParam) this.panelOpen.set(true);
  }

  /** Cinco toques seguidos no naipe do rodapé abrem os bastidores. */
  protected secretTap(): void {
    const now = Date.now();
    this.taps = now - this.lastTapAt > SECRET_WINDOW_MS ? 1 : this.taps + 1;
    this.lastTapAt = now;

    if (this.taps >= SECRET_TAPS) {
      this.taps = 0;
      this.panelOpen.set(true);
    }
  }
}
