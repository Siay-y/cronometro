import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import {
  BLACKJACK,
  Card,
  createDeck,
  dealerShouldHit,
  handValue,
  isBlackjack,
  isBust,
  Outcome,
  safeDraw,
  settle,
  shuffle,
  Verdict,
} from '../../../core/utils/blackjack.util';
import { vibrate } from '../../../core/utils/haptics.util';
import { BLACKJACK_LINES } from '../../../data/blackjack-lines.data';
import { Icon } from '../../../shared/ui/icon/icon';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';

/** De quem é a vez, ou se a mão acabou. */
type Phase = 'idle' | 'her' | 'gambit' | 'over';

/** O placar entre os dois, guardado no aparelho dela. */
interface Tally {
  readonly her: number;
  readonly gambit: number;
}

const TALLY_KEY = 'mon-cher:vinte-e-um:v1';

/** Compasso da mesa: uma carta de cada vez, com tempo de ver cair. */
const DEAL_STEP_MS = 320;
/** Depois que ela para, ele vira a carta escondida... */
const REVEAL_MS = 420;
/** ...e pensa um pouco antes de cada carta que puxa. */
const DRAW_MS = 900;
/** Abaixo disto, pedir carta não estoura nunca. */
const SAFE_HAND = 11;
/** Daqui para cima, o certo é parar. */
const STRONG_HAND = 17;

const CARD_PULSE_MS = 14;
const WIN_PULSE = [30, 50, 30, 50, 90] as const;
const LOSS_PULSE = [40, 80, 40] as const;

/**
 * Uma mão de vinte e um contra o Gambit.
 *
 * Ela pede carta ou para; ele vira a carta escondida e puxa até 16. As regras
 * da casa vivem em `blackjack.util` (e são todas a favor dela); as falas dele,
 * em `blackjack-lines.data`. Aqui fica só o compasso da mesa: uma carta de
 * cada vez, uma fala para cada momento, e o placar guardado no aparelho.
 */
@Component({
  selector: 'app-blackjack-table',
  imports: [PlayingCard, Icon],
  templateUrl: './blackjack-table.html',
  styleUrl: './blackjack-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-over]': "phase() === 'over'" },
})
export class BlackjackTable {
  protected readonly config = inject(CELEBRATION_CONFIG);
  private readonly storage = inject(LocalStorageService);

  protected readonly phase = signal<Phase>('idle');
  protected readonly her = signal<readonly Card[]>([]);
  protected readonly gambit = signal<readonly Card[]>([]);
  protected readonly holeRevealed = signal(false);
  /** A fala dele na mesa. A de abertura é fixa: o servidor e o navegador têm de concordar. */
  protected readonly line = signal(BLACKJACK_LINES.invite[0]);
  protected readonly outcome = signal<Outcome | null>(null);
  protected readonly tally = signal<Tally>(
    this.storage.read<Tally>(TALLY_KEY, { her: 0, gambit: 0 }),
  );

  protected readonly herValue = computed(() => handValue(this.her()));
  /** O que dá para somar dele: com a carta escondida, só a de cima conta. */
  protected readonly gambitValue = computed(() =>
    handValue(this.holeRevealed() ? this.gambit() : this.gambit().slice(0, 1)),
  );

  /** Ela pode pedir ou parar. Enquanto ele joga, as fichas ficam na mesa, apagadas. */
  protected readonly herTurn = computed(() => this.phase() === 'her');
  protected readonly idle = computed(() => this.phase() === 'idle');
  protected readonly over = computed(() => this.phase() === 'over');

  /** As primeiras cartas ainda estão caindo. */
  protected readonly dealing = computed(() => this.phase() === 'gambit' && this.her().length < 2);

  /** O risco de pedir, escrito na ficha: até que carta cabe sem estourar. */
  protected readonly hitHint = computed(() => {
    const room = safeDraw(this.her());
    if (room >= 10) return 'não estoura';
    if (room === 1) return 'só um ás cabe';

    return `cabe até ${room}`;
  });

  private deck: Card[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimers());
  }

  /** Dá as cartas: uma dela, uma dele, outra dela, e a escondida dele. */
  protected deal(): void {
    this.clearTimers();
    this.deck = shuffle(createDeck());
    this.her.set([]);
    this.gambit.set([]);
    this.holeRevealed.set(false);
    this.outcome.set(null);
    this.phase.set('gambit');
    this.say(BLACKJACK_LINES.deal);

    const order: ('her' | 'gambit')[] = ['her', 'gambit', 'her', 'gambit'];
    order.forEach((who, index) => {
      this.later(
        () => {
          this.draw(who);
          if (index === order.length - 1) this.openHand();
        },
        DEAL_STEP_MS * (index + 1),
      );
    });
  }

  protected hit(): void {
    if (!this.herTurn()) return;

    this.draw('her');
    const value = this.herValue();

    if (isBust(this.her())) {
      this.finish();
      return;
    }
    if (value === BLACKJACK) {
      this.stand();
      return;
    }

    this.say(BLACKJACK_LINES.hit);
    this.later(() => this.adviseHer(), DEAL_STEP_MS * 2);
  }

  /** Ela para: ele vira a carta escondida e joga a mão dele. */
  protected stand(): void {
    if (!this.herTurn()) return;

    this.phase.set('gambit');
    this.say(BLACKJACK_LINES.stand);
    this.later(() => {
      this.holeRevealed.set(true);
      this.playGambit();
    }, REVEAL_MS);
  }

  /** As duas primeiras cartas caíram: vinte e um de primeira resolve na hora. */
  private openHand(): void {
    if (isBlackjack(this.her())) {
      this.holeRevealed.set(true);
      this.finish();
      return;
    }

    this.phase.set('her');
    this.adviseHer();
  }

  /** Ele puxa até 16, uma carta de cada vez, e então acerta as contas. */
  private playGambit(): void {
    if (!dealerShouldHit(this.gambit())) {
      this.later(() => this.finish(), DRAW_MS / 2);
      return;
    }

    this.later(() => {
      this.draw('gambit');
      this.say(BLACKJACK_LINES.draw);
      this.playGambit();
    }, DRAW_MS);
  }

  private finish(): void {
    const { outcome, verdict } = settle(this.her(), this.gambit());

    this.phase.set('over');
    this.outcome.set(outcome);
    this.sayVerdict(verdict);
    vibrate(outcome === 'her' ? WIN_PULSE : LOSS_PULSE);

    const next: Tally = {
      her: this.tally().her + (outcome === 'her' ? 1 : 0),
      gambit: this.tally().gambit + (outcome === 'gambit' ? 1 : 0),
    };
    this.tally.set(next);
    this.storage.write(TALLY_KEY, next);
  }

  private draw(who: 'her' | 'gambit'): void {
    const card = this.deck.pop();
    if (!card) return;

    const hand = who === 'her' ? this.her : this.gambit;
    hand.update((cards) => [...cards, card]);
    vibrate(CARD_PULSE_MS);
  }

  /** O comentário dele sobre a mão dela, pelo valor. */
  private adviseHer(): void {
    const value = this.herValue();
    const lines =
      value <= SAFE_HAND
        ? BLACKJACK_LINES.low
        : value < STRONG_HAND
          ? BLACKJACK_LINES.middle
          : BLACKJACK_LINES.high;

    this.say(lines, value);
  }

  private sayVerdict(verdict: Verdict): void {
    this.say(BLACKJACK_LINES.verdict[verdict]);
  }

  private say(lines: readonly string[], value = this.herValue()): void {
    const index = Math.min(Math.floor(Math.random() * lines.length), lines.length - 1);
    this.line.set(lines[index].replace('{v}', String(value)));
  }

  private later(action: () => void, ms: number): void {
    this.timers.push(setTimeout(action, ms));
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
