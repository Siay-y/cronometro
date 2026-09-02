import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName = 'lock' | 'spark' | 'letter';

interface IconShape {
  readonly paths: readonly string[];
  /** Traçado (padrão) ou sólido. */
  readonly solid?: boolean;
}

/**
 * Desenhos em 24x24, alinhados ao traço fino do resto da interface.
 * Nada de emoji: assim o ícone herda a cor do texto e fica igual em todo
 * sistema operacional, em vez de virar o desenho colorido de cada fabricante.
 */
const ICONS: Record<IconName, IconShape> = {
  lock: {
    paths: [
      'M8.2 10.6V7.8a3.8 3.8 0 0 1 7.6 0v2.8',
      'M6.8 10.6h10.4a2.2 2.2 0 0 1 2.2 2.2v5.2a2.2 2.2 0 0 1-2.2 2.2H6.8a2.2 2.2 0 0 1-2.2-2.2v-5.2a2.2 2.2 0 0 1 2.2-2.2Z',
      'M12 14.7v1.8',
    ],
  },
  spark: {
    paths: [
      'M12 3.8c.8 5.4 2.8 7.4 8.2 8.2-5.4.8-7.4 2.8-8.2 8.2-.8-5.4-2.8-7.4-8.2-8.2C9.2 11.2 11.2 9.2 12 3.8Z',
    ],
    solid: true,
  },
  letter: {
    paths: [
      'M4.4 6.4h15.2a1.9 1.9 0 0 1 1.9 1.9v7.4a1.9 1.9 0 0 1-1.9 1.9H4.4a1.9 1.9 0 0 1-1.9-1.9V8.3a1.9 1.9 0 0 1 1.9-1.9Z',
      'm3 8 9 6.1L21 8',
    ],
  },
};

/** Ícone vetorial que acompanha a cor e o tamanho da fonte de quem o contém. */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.fill]="shape().solid ? 'currentColor' : 'none'"
      [attr.stroke]="shape().solid ? 'none' : 'currentColor'"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @for (path of shape().paths; track $index) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      inline-size: 1.15em;
      block-size: 1.15em;
    }

    svg {
      inline-size: 100%;
      block-size: 100%;
    }
  `,
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();

  protected readonly shape = computed(() => ICONS[this.name()]);
}
