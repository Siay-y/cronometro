import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { SealedGift } from '../../../core/models/gift-event.model';
import { vibrate } from '../../../core/utils/haptics.util';
import { Icon } from '../../../shared/ui/icon/icon';
import { PhotoFrame } from '../photo-frame/photo-frame';

/** Dedo na caixa até ela não aguentar mais. O mesmo ritual do resto do site. */
const CHARGE_MS = 1200;
/** A tampa voa e a foto sobe de dentro. Espelhado no SCSS. */
const OPEN_MS = 1350;

/** Entrada do texto depois que a foto se acomoda. */
const INK_DELAY_MS = 520;
const INK_STEP_MS = 180;

const CHARGE_PULSES = [8, 150, 12, 140, 16, 130, 20, 110, 26, 90, 34, 70, 44] as const;
const POP_PULSE = [60, 40, 90] as const;
type BoxPhase = 'closed' | 'charging' | 'opening' | 'open';

/**
 * A caixa de presente embrulhada.
 *
 * Ela segura a caixa: a caixa chacoalha cada vez mais forte enquanto a energia
 * sobe, até que a tampa voa, a fita estoura e a foto sai de dentro. Depois a
 * foto se acomoda grande, num porta-retratos de papel, com o que estiver
 * escrito embaixo.
 *
 * Soltar antes da hora acalma a caixa e nada acontece.
 *
 * A foto aberta é um `PhotoFrame`: tocar nela abre o retrato de perto, que
 * inclina e vira para mostrar o que está escrito atrás.
 */
@Component({
  selector: 'app-gift-box',
  imports: [Icon, PhotoFrame],
  templateUrl: './gift-box.html',
  styleUrl: './gift-box.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-charging]': "phase() === 'charging'",
    '[class.is-opening]': "phase() === 'opening' || phase() === 'open'",
    '[class.is-open]': "phase() === 'open'",
  },
})
export class GiftBox {
  readonly gift = input.required<SealedGift>();

  protected readonly phase = signal<BoxPhase>('closed');
  protected readonly opened = computed(() => this.phase() === 'open');

  /** Cada linha em branco do texto vira um parágrafo, como no resto. */
  protected readonly paragraphs = computed(() =>
    this.gift()
      .reveal.split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );

  protected readonly inkDelay = INK_DELAY_MS;
  protected readonly inkStep = INK_STEP_MS;

  private timers: ReturnType<typeof setTimeout>[] = [];
  /** Marca que o dedo já cuidou desta interação, para o clique não repetir. */
  private handledByPointer = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimers());
  }

  protected pressStart(): void {
    if (this.phase() !== 'closed') return;

    this.handledByPointer = true;
    this.phase.set('charging');
    vibrate(CHARGE_PULSES);
    this.timers.push(setTimeout(() => this.pop(), CHARGE_MS));
  }

  /** Soltar antes da hora: a caixa se acalma e continua fechada. */
  protected pressEnd(): void {
    if (this.phase() !== 'charging') return;

    this.clearTimers();
    this.phase.set('closed');
    vibrate(0);
  }

  /** Enter e Espaço disparam `click` sem `pointerdown`: pelo teclado, abre direto. */
  protected select(): void {
    if (this.handledByPointer) {
      this.handledByPointer = false;
      return;
    }

    if (this.phase() === 'closed') this.pop();
  }

  private pop(): void {
    this.clearTimers();

    // Quem pediu menos movimento recebe a foto já fora da caixa.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      this.phase.set('open');
      return;
    }

    this.phase.set('opening');
    vibrate(POP_PULSE);
    this.timers.push(setTimeout(() => this.phase.set('open'), OPEN_MS));
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
