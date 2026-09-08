import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { clamp } from '../../../core/utils/time.util';

/** Inclinação máxima da carta, em graus, em cada eixo. */
const MAX_TILT = 11;

/**
 * A carta de baralho que o Gambit carrega de energia.
 *
 * `charge` (0 a 1) controla a intensidade da aura, e é o mesmo número que a
 * contagem regressiva usa como progresso, então a carta vai literalmente se
 * carregando conforme o aniversário se aproxima.
 *
 * A carta também é holográfica: ela se inclina em 3D na direção do ponteiro e
 * uma camada de foil arco-íris corre pela superfície, como carta rara pegando
 * luz. Tudo isso é escrito direto em variáveis CSS do elemento, fora do ciclo
 * do Angular — mover o dedo sobre a carta não dispara detecção de mudanças.
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
  /** Desliga o efeito holográfico em cartas puramente decorativas. */
  readonly holographic = input(true, { transform: booleanAttribute });

  protected readonly red = computed(() => this.suit() === '♥' || this.suit() === '♦');
  protected readonly glow = computed(() => 0.25 + this.charge() * 0.75);
  protected readonly lift = computed(() => 1 + this.charge() * 0.06);

  protected readonly ariaLabel = computed(() =>
    this.faceDown() ? 'Carta virada para baixo' : `Carta ${this.rank()} de ${this.suit()}`,
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.followPointer());
  }

  /**
   * Vira a carta na direção de um ponto da tela. É o que o card de presente
   * chama quando o dedo dela encosta para carregar: a carta se volta para ela.
   */
  tiltTo(clientX: number, clientY: number): void {
    this.applyTilt(clientX, clientY, this.host.nativeElement.getBoundingClientRect());
  }

  /** Devolve a carta ao repouso, com uma volta mais lenta que a ida. */
  resetTilt(): void {
    const style = this.host.nativeElement.style;

    this.host.nativeElement.classList.remove('is-tilting');
    style.setProperty('--tilt-x', '0deg');
    style.setProperty('--tilt-y', '0deg');
    style.setProperty('--shine-x', '50%');
    style.setProperty('--shine-y', '50%');
    style.setProperty('--foil-x', '50%');
    style.setProperty('--foil-y', '50%');
  }

  /** No desktop, passar o mouse por cima já basta para a carta ganhar vida. */
  private followPointer(): void {
    if (!this.holographic()) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const element = this.host.nativeElement;
    let bounds: DOMRect | null = null;
    let pending: PointerEvent | null = null;
    let frame = 0;

    // O retângulo é medido uma vez por entrada, e não a cada quadro: assim o
    // movimento não força recálculo de layout o tempo todo.
    const onEnter = () => (bounds = element.getBoundingClientRect());

    const onMove = (event: PointerEvent) => {
      pending = event;
      frame ||= requestAnimationFrame(() => {
        frame = 0;
        if (pending) this.applyTilt(pending.clientX, pending.clientY, bounds);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
      this.resetTilt();
    };

    element.addEventListener('pointerenter', onEnter, { passive: true });
    element.addEventListener('pointermove', onMove, { passive: true });
    element.addEventListener('pointerleave', onLeave, { passive: true });

    this.destroyRef.onDestroy(() => {
      element.removeEventListener('pointerenter', onEnter);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    });
  }

  private applyTilt(clientX: number, clientY: number, bounds: DOMRect | null): void {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;

    const element = this.host.nativeElement;
    const rect = bounds ?? element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Posição do ponteiro dentro da carta, de 0 a 1 em cada eixo.
    const px = clamp((clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((clientY - rect.top) / rect.height, 0, 1);

    const style = element.style;
    style.setProperty('--tilt-y', `${((px - 0.5) * MAX_TILT * 2).toFixed(2)}deg`);
    style.setProperty('--tilt-x', `${((0.5 - py) * MAX_TILT * 2).toFixed(2)}deg`);
    style.setProperty('--shine-x', `${(px * 100).toFixed(1)}%`);
    style.setProperty('--shine-y', `${(py * 100).toFixed(1)}%`);
    // O foil corre bem mais que o ponteiro: é o que dá a sensação de metal.
    style.setProperty('--foil-x', `${(10 + px * 80).toFixed(1)}%`);
    style.setProperty('--foil-y', `${(10 + py * 80).toFixed(1)}%`);
    element.classList.add('is-tilting');
  }
}
