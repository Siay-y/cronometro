import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * A carta de baralho que o Gambit carrega de energia.
 *
 * `charge` (0 a 1) controla a intensidade da aura, e é o mesmo número que a
 * contagem regressiva usa como progresso, então a carta vai literalmente se
 * carregando conforme o aniversário se aproxima.
 */
@Component({
  selector: 'app-playing-card',
  templateUrl: './playing-card.html',
  styleUrl: './playing-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.is-face-down]': 'faceDown()',
  },
})
export class PlayingCard {
  readonly rank = input('A');
  readonly suit = input('♠');
  readonly charge = input(0.5);
  readonly faceDown = input(false, { transform: booleanAttribute });
  /** Emoji ou símbolo exibido no centro no lugar do naipe. */
  readonly emblem = input<string | null>(null);

  protected readonly red = computed(() => this.suit() === '♥' || this.suit() === '♦');
  protected readonly glow = computed(() => 0.25 + this.charge() * 0.75);
  protected readonly lift = computed(() => 1 + this.charge() * 0.06);

  protected readonly ariaLabel = computed(() =>
    this.faceDown() ? 'Carta virada para baixo' : `Carta ${this.rank()} de ${this.suit()}`,
  );
}
