import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';

interface DriftingCard {
  readonly id: number;
  readonly suit: string;
  readonly left: number;
  readonly top: number;
  readonly size: number;
  readonly duration: number;
  readonly delay: number;
  readonly opacity: number;
  readonly variant: 'driftA' | 'driftB' | 'driftC';
}

const SUITS = ['♠', '♥', '♦', '♣'] as const;
const VARIANTS = ['driftA', 'driftB', 'driftC'] as const;

/** Fração da distância percorrida por quadro: quanto menor, mais o brilho arrasta. */
const FOLLOW_EASING = 0.12;
/** Abaixo disso o cursor é considerado parado e o loop de animação descansa. */
const SETTLED_PX = 0.4;

/**
 * PRNG com semente fixa: o servidor e o navegador geram exatamente o mesmo
 * layout, então a hidratação nunca reposiciona as cartas.
 */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CARDS: readonly DriftingCard[] = ((): DriftingCard[] => {
  const random = seededRandom(20260915);

  return Array.from({ length: 16 }, (_, id) => ({
    id,
    suit: SUITS[Math.floor(random() * SUITS.length)],
    left: Math.round(random() * 96),
    top: Math.round(random() * 92),
    size: Math.round(16 + random() * 40),
    duration: Math.round(14 + random() * 16),
    delay: Math.round(random() * -20),
    opacity: 0.05 + random() * 0.16,
    variant: VARIANTS[Math.floor(random() * VARIANTS.length)],
  }));
})();

/**
 * Plano de fundo decorativo: auras de energia cinética e naipes de baralho à
 * deriva, que respondem ao cursor.
 *
 * O rastro do ponteiro é escrito direto em variáveis CSS do elemento, fora do
 * ciclo do Angular: nenhum `signal` é tocado a cada movimento, então mover o
 * mouse não dispara detecção de mudanças. O loop de `requestAnimationFrame`
 * ainda dorme sozinho assim que o cursor para.
 */
@Component({
  selector: 'app-kinetic-backdrop',
  templateUrl: './kinetic-backdrop.html',
  styleUrl: './kinetic-backdrop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class KineticBackdrop {
  /** Energia acumulada (0 a 1): quanto mais perto do dia, mais forte o brilho. */
  readonly intensity = input(0.35);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly burst = viewChild.required<ElementRef<HTMLElement>>('burst');

  protected readonly cards = CARDS;
  protected readonly auraOpacity = computed(() => 0.3 + this.intensity() * 0.55);
  protected readonly auraScale = computed(() => 1 + this.intensity() * 0.25);

  constructor() {
    afterNextRender(() => this.followPointer());
  }

  /**
   * Faz o cenário reagir ao ponteiro: um halo carregado segue o cursor com um
   * leve atraso, as camadas se deslocam em profundidades diferentes (parallax)
   * e cada clique solta uma carta de energia.
   */
  private followPointer(): void {
    // `?.` porque nem todo ambiente expõe matchMedia; na dúvida, animamos.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const element = this.host.nativeElement;
    const burst = this.burst().nativeElement;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let frame = 0;

    const draw = () => {
      currentX += (targetX - currentX) * FOLLOW_EASING;
      currentY += (targetY - currentY) * FOLLOW_EASING;

      element.style.setProperty('--pointer-x', `${currentX.toFixed(1)}px`);
      element.style.setProperty('--pointer-y', `${currentY.toFixed(1)}px`);
      element.style.setProperty('--tilt-x', (currentX / window.innerWidth - 0.5).toFixed(3));
      element.style.setProperty('--tilt-y', (currentY / window.innerHeight - 0.5).toFixed(3));

      const settled =
        Math.abs(targetX - currentX) < SETTLED_PX && Math.abs(targetY - currentY) < SETTLED_PX;
      frame = settled ? 0 : requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      element.classList.add('has-pointer');
      frame ||= requestAnimationFrame(draw);
    };

    const onDown = (event: PointerEvent) => {
      burst.style.setProperty('--burst-x', `${event.clientX}px`);
      burst.style.setProperty('--burst-y', `${event.clientY}px`);
      // Remover, forçar o reflow e recolocar reinicia a animação a cada clique.
      burst.classList.remove('is-firing');
      void burst.offsetWidth;
      burst.classList.add('is-firing');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      cancelAnimationFrame(frame);
    });
  }
}
