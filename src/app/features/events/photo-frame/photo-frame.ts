import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { LetterPhoto } from '../../../core/models/gift-event.model';
import { Icon } from '../../../shared/ui/icon/icon';
import { PhotoViewer } from '../photo-viewer/photo-viewer';
import { ScratchFoil } from '../scratch-foil/scratch-foil';

/**
 * O porta-retratos de papel: a foto com a legenda embaixo, levemente torta,
 * como quem apoiou na mesa. Tocar nela abre o `PhotoViewer`, o retrato de
 * perto, que inclina e (quando tem `back`) vira para mostrar o verso.
 *
 * Uma foto com `foil` chega coberta por uma raspadinha holográfica: ela raspa
 * com o dedo, e só depois de revelada a moldura passa a abrir o visor.
 *
 * É o mesmo retrato que sai da caixa de presente e que fecha o presente
 * principal, então mora aqui e não em cada um deles.
 */
@Component({
  selector: 'app-photo-frame',
  imports: [Icon, PhotoViewer, ScratchFoil],
  templateUrl: './photo-frame.html',
  styleUrl: './photo-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoFrame {
  readonly photo = input.required<LetterPhoto>();
  /** O que está escrito à mão atrás da foto. Sem isto, o retrato não vira. */
  readonly back = input<string>();

  private readonly viewer = viewChild.required(PhotoViewer);

  /** Ela já raspou (ou a foto nunca teve foil). */
  protected readonly revealed = signal(false);
  protected readonly foiled = computed(() => this.photo().foil === true && !this.revealed());

  protected view(): void {
    if (this.foiled()) return;
    this.viewer().open();
  }
}
