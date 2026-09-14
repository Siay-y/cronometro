import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { vibrate } from '../../../core/utils/haptics.util';
import { clearedRatio } from '../../../core/utils/scratch.util';

/** Uma fagulha solta onde o dedo passou. */
interface Spark {
  readonly id: number;
  /** Posição dentro do foil, em % da largura/altura. */
  readonly x: number;
  readonly y: number;
  readonly variant: number;
}

/** Raspou isto e o resto do foil se dissolve sozinho. */
const REVEAL_AT = 0.6;
/** O bitmap do foil: fixo, o CSS estica. Grande o bastante para não serrilhar. */
const FOIL_PX = 720;
/** Grade usada para medir quanto já foi raspado: barata e suficiente. */
const SAMPLE_PX = 32;
/** Largura do rastro do dedo, como fração do lado do foil. */
const STROKE = 0.14;
/** A cada tantos traços, medimos o progresso. */
const MEASURE_EVERY = 6;
const SPARK_EVERY_MS = 45;
const MAX_SPARKS = 24;
const SPARK_VARIANTS = 4;
const RUB_PULSE_MS = 6;
const RUB_EVERY_MS = 90;
const REVEAL_PULSE = [30, 40, 30, 40, 90] as const;

/**
 * O foil de raspadinha por cima de uma foto.
 *
 * Um canvas pintado de holografia magenta-violeta-ouro, com "raspe aqui" no
 * meio. O dedo apaga por onde passa (composição `destination-out`), solta
 * fagulhas e faz o celular vibrar de leve, como atrito. Raspou o bastante, o
 * resto se dissolve sozinho e `revealed` avisa quem está por fora.
 *
 * Sem canvas (leitor de tela, navegador antigo, teste) não tem raspadinha: a
 * foto aparece direto, porque o foil é brincadeira, e não pedágio. Pelo
 * teclado, um botão escondido revela na hora.
 */
@Component({
  selector: 'app-scratch-foil',
  templateUrl: './scratch-foil.html',
  styleUrl: './scratch-foil.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-revealed]': 'revealing()',
    '(pointerdown)': 'begin($event)',
    '(pointermove)': 'rub($event)',
    '(pointerup)': 'end()',
    '(pointercancel)': 'end()',
    '(lostpointercapture)': 'end()',
  },
})
export class ScratchFoil {
  /** Ela raspou o bastante (ou pediu para revelar): a foto está à mostra. */
  readonly revealed = output<void>();

  protected readonly revealing = signal(false);
  protected readonly sparks = signal<readonly Spark[]>([]);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private ctx: CanvasRenderingContext2D | null = null;
  private sample: CanvasRenderingContext2D | null = null;
  private scratching = false;
  private last: { x: number; y: number } | null = null;
  private strokes = 0;
  private lastSparkAt = 0;
  private lastRubAt = 0;
  private nextSparkId = 0;

  constructor() {
    afterNextRender(() => this.paint());
    inject(DestroyRef).onDestroy(() => (this.ctx = null));
  }

  /** Revela sem raspar: o botão do teclado e o toque duplo chegam aqui. */
  protected reveal(): void {
    if (this.revealing()) return;

    this.revealing.set(true);
    this.scratching = false;
    vibrate(REVEAL_PULSE);
    this.revealed.emit();
  }

  protected begin(event: PointerEvent): void {
    if (!this.ctx || this.revealing()) return;

    this.scratching = true;
    this.last = null;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.rub(event);
  }

  protected rub(event: PointerEvent): void {
    if (!this.scratching || !this.ctx) return;

    const rect = this.host.nativeElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((event.clientX - rect.left) / rect.width) * FOIL_PX;
    const y = ((event.clientY - rect.top) / rect.height) * FOIL_PX;

    this.erase(x, y);
    this.spark(event.clientX - rect.left, event.clientY - rect.top, rect);
    this.buzz(event.timeStamp);

    if (++this.strokes % MEASURE_EVERY === 0) this.measure();
  }

  protected end(): void {
    if (!this.scratching) return;

    this.scratching = false;
    this.last = null;
    this.measure();
  }

  /** Cada fagulha se apaga ao fim da própria animação. */
  protected retireSpark(id: number): void {
    this.sparks.update((current) => current.filter((spark) => spark.id !== id));
  }

  private erase(x: number, y: number): void {
    const ctx = this.ctx!;
    const from = this.last ?? { x, y };

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = FOIL_PX * STROKE;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    this.last = { x, y };
  }

  private spark(x: number, y: number, rect: DOMRect): void {
    const now = performance.now();
    if (now - this.lastSparkAt < SPARK_EVERY_MS) return;
    this.lastSparkAt = now;

    const spark: Spark = {
      id: this.nextSparkId++,
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      variant: 1 + (this.nextSparkId % SPARK_VARIANTS),
    };
    this.sparks.update((current) => [...current, spark].slice(-MAX_SPARKS));
  }

  /** Atrito: um zumbido curtinho enquanto o dedo arrasta. */
  private buzz(at: number): void {
    if (at - this.lastRubAt < RUB_EVERY_MS) return;
    this.lastRubAt = at;
    vibrate(RUB_PULSE_MS);
  }

  private measure(): void {
    if (!this.ctx || !this.sample || this.revealing()) return;

    this.sample.clearRect(0, 0, SAMPLE_PX, SAMPLE_PX);
    this.sample.drawImage(this.canvas().nativeElement, 0, 0, SAMPLE_PX, SAMPLE_PX);
    const { data } = this.sample.getImageData(0, 0, SAMPLE_PX, SAMPLE_PX);

    if (clearedRatio(data) >= REVEAL_AT) this.reveal();
  }

  /** Pinta o foil. Sem contexto 2D não há o que raspar: revela direto. */
  private paint(): void {
    const canvas = this.canvas().nativeElement;
    canvas.width = FOIL_PX;
    canvas.height = FOIL_PX;

    const ctx = canvas.getContext('2d');
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = SAMPLE_PX;
    sampleCanvas.height = SAMPLE_PX;
    const sample = sampleCanvas.getContext('2d', { willReadFrequently: true });

    if (!ctx || !sample) {
      this.reveal();
      return;
    }

    this.ctx = ctx;
    this.sample = sample;

    // Holografia: bandas diagonais de magenta, lilás, violeta e ouro.
    const bands = ctx.createLinearGradient(0, 0, FOIL_PX, FOIL_PX);
    const stops: [number, string][] = [
      [0, '#ff2d95'],
      [0.18, '#e879f9'],
      [0.36, '#8b5cf6'],
      [0.54, '#f6c453'],
      [0.72, '#ff2d95'],
      [0.9, '#8b5cf6'],
      [1, '#ff8ac7'],
    ];
    for (const [offset, color] of stops) bands.addColorStop(offset, color);
    ctx.fillStyle = bands;
    ctx.fillRect(0, 0, FOIL_PX, FOIL_PX);

    // Um brilho de luz batendo de cima, para o foil parecer metal e não tinta.
    const sheen = ctx.createRadialGradient(
      FOIL_PX * 0.3,
      FOIL_PX * 0.2,
      0,
      FOIL_PX * 0.3,
      FOIL_PX * 0.2,
      FOIL_PX * 0.9,
    );
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    sheen.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, FOIL_PX, FOIL_PX);

    // Grão fino, o mesmo do papel de embrulho da caixa.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    const step = FOIL_PX / 40;
    for (let row = 0; row < 40; row++) {
      for (let col = 0; col < 40; col++) {
        ctx.beginPath();
        ctx.arc(col * step + step * 0.3, row * step + step * 0.3, step * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // O convite, no meio.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.shadowColor = 'rgba(80, 0, 45, 0.45)';
    ctx.shadowBlur = FOIL_PX * 0.02;
    ctx.font = `${FOIL_PX * 0.2}px 'Cormorant Garamond', Georgia, serif`;
    ctx.fillText('♠', FOIL_PX / 2, FOIL_PX * 0.4);
    ctx.font = `600 ${FOIL_PX * 0.075}px 'Bebas Neue', Impact, sans-serif`;
    ctx.fillText('R A S P E   A Q U I', FOIL_PX / 2, FOIL_PX * 0.6);
    ctx.shadowBlur = 0;
  }
}
