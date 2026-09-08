import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { dealTrick, OPENING_HAND, TrickCard } from '../../../core/utils/card-trick.util';
import { vibrate } from '../../../core/utils/haptics.util';
import { Icon } from '../../../shared/ui/icon/icon';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';

/** Dedo na tela até o baralho detonar. O mesmo ritual do card de presente. */
const CHARGE_MS = 1200;
/** Duração do embaralho inteiro, do estouro ao pouso. Espelhada no SCSS. */
const SHUFFLE_MS = 1150;
/**
 * Instante em que as cinco viram quatro.
 *
 * Precisa cair no meio do giro, com as cartas de costas: um pouco antes e ela
 * veria as faces trocando; um pouco depois e o leque se reabriria com cinco.
 */
const SWAP_MS = 560;

/** Abertura do leque e o quanto as pontas descem, como um leque de verdade. */
const FAN_STEP_DEG = 8;
const FAN_LIFT_PX = 6;
/** Atraso entre uma carta e a seguinte: é o que faz o giro virar uma onda. */
const FAN_STAGGER_MS = 55;

const CHARGE_PULSES = [8, 150, 12, 140, 16, 130, 20, 110, 26, 90, 34, 70, 44] as const;
const DETONATION_PULSE = 70;

type Phase = 'idle' | 'charging' | 'shuffling' | 'reveal';

interface TrickSlot {
  readonly card: TrickCard;
  /** Posição no leque, escrita em `rotate`/`translate` para não brigar com o
   *  `transform` das animações: são propriedades independentes e se somam. */
  readonly rotate: string;
  readonly translate: string;
  readonly delay: number;
}

/**
 * O golpe do Gambit: um truque de cartas que funciona de verdade.
 *
 * Ela guarda uma das cinco na cabeça, segura o baralho até a energia subir, e
 * quando as cartas param de girar voltaram quatro — nenhuma delas a dela. Não
 * há adivinhação nem pergunta: as quatro nunca estiveram entre as cinco (ver
 * `card-trick.util.ts`), então a carta dela some sempre, para qualquer pessoa.
 *
 * A encenação é toda de CSS: o giro é uma animação com atraso por carta, e a
 * troca das cinco pelas quatro acontece no meio dele, com as cartas de costas.
 * O `track $index` do laço é proposital — assim o Angular reaproveita os
 * mesmos elementos e o giro continua sem cortar quando a mão troca.
 */
@Component({
  selector: 'app-card-trick',
  imports: [PlayingCard, Icon],
  templateUrl: './card-trick.html',
  styleUrl: './card-trick.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-charging]': "phase() === 'charging'",
    '[class.is-shuffling]': "phase() === 'shuffling'",
    '[class.is-revealed]': "phase() === 'reveal'",
  },
})
export class CardTrick {
  /** Mesma carga do contador: as cartas do truque chegam junto com o resto. */
  readonly charge = input(0.5);

  protected readonly config = inject(CELEBRATION_CONFIG);
  protected readonly phase = signal<Phase>('idle');

  private readonly hand = signal(OPENING_HAND);
  /** Marca a virada das cinco para as quatro, no meio do embaralho. */
  private readonly swapped = signal(false);

  protected readonly cards = computed(() =>
    this.swapped() ? this.hand().returned : this.hand().shown,
  );

  /** O leque já calculado: ângulo, altura e atraso de cada carta. */
  protected readonly slots = computed<TrickSlot[]>(() => {
    const cards = this.cards();
    const middle = (cards.length - 1) / 2;

    return cards.map((card, index) => {
      const fromCenter = index - middle;

      return {
        card,
        rotate: `${(fromCenter * FAN_STEP_DEG).toFixed(1)}deg`,
        // Quadrático: o meio fica no alto e as pontas descem.
        translate: `0 ${(fromCenter * fromCenter * FAN_LIFT_PX).toFixed(0)}px`,
        delay: index * FAN_STAGGER_MS,
      };
    });
  });

  /** De costas enquanto giram: é o que esconde a troca da mão. */
  protected readonly faceDown = computed(() => this.phase() === 'shuffling');
  protected readonly revealed = computed(() => this.phase() === 'reveal');
  /** Fora do repouso as cartas ficam no talo, carregadas de energia. */
  protected readonly cardCharge = computed(() => (this.phase() === 'idle' ? this.charge() : 1));

  private timers: ReturnType<typeof setTimeout>[] = [];
  /** Marca que o dedo já cuidou desta interação, para o clique não repetir. */
  private handledByPointer = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimers());

    // Só no navegador, e só depois da hidratação: sortear antes disso faria o
    // HTML do servidor divergir do primeiro render (ver a mão de abertura).
    afterNextRender(() => this.hand.set(dealTrick()));
  }

  protected pressStart(): void {
    if (this.phase() !== 'idle') return;

    this.handledByPointer = true;
    this.phase.set('charging');
    vibrate(CHARGE_PULSES);
    this.timers.push(setTimeout(() => this.shuffle(), CHARGE_MS));
  }

  /** Soltar antes da hora descarrega o baralho, e nada acontece. */
  protected pressEnd(): void {
    if (this.phase() !== 'charging') return;

    this.clearTimers();
    this.phase.set('idle');
    vibrate(0);
  }

  /**
   * Cobre o toque simples e, de graça, o teclado: Enter e Espaço disparam
   * `click` sem nenhum `pointerdown` antes, então quem navega pelo teclado
   * embaralha direto, sem precisar segurar nada.
   */
  protected select(): void {
    if (this.handledByPointer) {
      this.handledByPointer = false;
      return;
    }

    if (this.phase() === 'idle') this.shuffle();
  }

  /** Devolve as cinco à mesa e sorteia cartas novas para a próxima rodada. */
  protected again(): void {
    this.clearTimers();
    this.swapped.set(false);
    this.hand.set(dealTrick());
    this.phase.set('idle');
  }

  private shuffle(): void {
    this.clearTimers();
    this.phase.set('shuffling');
    vibrate(DETONATION_PULSE);

    this.timers.push(
      setTimeout(() => this.swapped.set(true), SWAP_MS),
      setTimeout(() => this.phase.set('reveal'), SHUFFLE_MS),
    );
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
