import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { LetterPhoto } from '../../../core/models/gift-event.model';
import { vibrate } from '../../../core/utils/haptics.util';

/** Quanto o retrato inclina, em graus, com o dedo na beirada. */
const MAX_TILT_DEG = 12;
const FLIP_PULSE = [14, 60, 22] as const;

/** Inclinação do retrato e onde a luz bate nele, ambos seguindo o dedo. */
interface Tilt {
  /** Rotação em X e Y, em graus. */
  readonly x: number;
  readonly y: number;
  /** Ponto do brilho, em % da largura e da altura. */
  readonly gx: number;
  readonly gy: number;
  /** `true` enquanto há um dedo (ou o mouse) sobre o retrato. */
  readonly live: boolean;
}

const REST: Tilt = { x: 0, y: 0, gx: 50, gy: 50, live: false };

/**
 * A foto de perto.
 *
 * Um `<dialog>` nativo: `showModal()` o leva para a top layer do navegador,
 * por cima de qualquer painel que role, e o Esc já fecha sozinho. Dentro, o
 * retrato inclina para onde o dedo está e a luz reflete ali, como uma carta
 * carregada. Quando há algo escrito atrás (`back`), tocar no retrato o vira.
 *
 * Fica fechado no DOM até alguém chamar `open()`.
 */
@Component({
  selector: 'app-photo-viewer',
  templateUrl: './photo-viewer.html',
  styleUrl: './photo-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoViewer {
  readonly photo = input.required<LetterPhoto>();
  /** O que está escrito à mão atrás da foto. Linha em branco vira parágrafo. */
  readonly back = input<string>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly viewing = signal(false);
  protected readonly flipped = signal(false);
  protected readonly tilt = signal<Tilt>(REST);

  protected readonly backParagraphs = computed(() =>
    (this.back() ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );
  protected readonly hasBack = computed(() => this.backParagraphs().length > 0);

  open(): void {
    this.flipped.set(false);
    this.viewing.set(true);
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /** O `close` nativo cobre o Esc também, então o estado se acerta aqui. */
  protected onClosed(): void {
    this.viewing.set(false);
    this.flipped.set(false);
    this.settle();
  }

  /** O diálogo ocupa a tela toda: clique fora do retrato é clique nele mesmo. */
  protected onScrimClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  protected flip(): void {
    if (!this.hasBack()) return;

    this.flipped.update((flipped) => !flipped);
    vibrate(FLIP_PULSE);
  }

  /** O retrato inclina para onde o dedo está, e a luz bate ali. */
  protected follow(event: PointerEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    this.tilt.set({
      x: (0.5 - py) * 2 * MAX_TILT_DEG,
      y: (px - 0.5) * 2 * MAX_TILT_DEG,
      gx: px * 100,
      gy: py * 100,
      live: true,
    });
  }

  protected settle(): void {
    this.tilt.set(REST);
  }
}
