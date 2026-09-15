import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName =
  | 'lock'
  | 'spark'
  | 'letter'
  | 'joker'
  | 'gamepad'
  | 'joystick'
  | 'bag'
  | 'ribbon'
  | 'gift'
  | 'spade'
  | 'coins';

interface IconShape {
  readonly paths: readonly string[];
  /** Traçado (padrão) ou sólido. */
  readonly solid?: boolean;
}

/**
 * Desenhos em 24x24, alinhados ao traço fino do resto da interface.
 * Nada de emoji: assim o ícone herda a cor do texto e fica igual em todo
 * sistema operacional, em vez de virar o desenho colorido de cada fabricante.
 *
 * Os emblemas das cartas (`joker`, `gamepad`, ...) seguem a mesma regra: no
 * baralho eles são pintados com a tinta da carta, como um naipe.
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
  /* A primeira carta: uma carta na frente, outra espiando atrás, uma fagulha no meio. */
  joker: {
    paths: [
      'M8.4 6.2h7.2a1.7 1.7 0 0 1 1.7 1.7v11a1.7 1.7 0 0 1-1.7 1.7H8.4a1.7 1.7 0 0 1-1.7-1.7v-11a1.7 1.7 0 0 1 1.7-1.7Z',
      'M9.6 6.2 10.3 3.5l8.4 2.2-1.3 5',
      'M12 9.9c.3 1.9 1 2.6 2.9 2.9-1.9.3-2.6 1-2.9 2.9-.3-1.9-1-2.6-2.9-2.9 1.9-.3 2.6-1 2.9-2.9Z',
    ],
  },
  /* O controle: corpo, direcional à esquerda, dois botões à direita. */
  gamepad: {
    paths: [
      'M7.4 7.6h9.2a4.4 4.4 0 0 1 4.4 4.4v1.9a3.3 3.3 0 0 1-5.8 2.1l-1-1.2H9.8l-1 1.2A3.3 3.3 0 0 1 3 13.9V12a4.4 4.4 0 0 1 4.4-4.4Z',
      'M8 10.6v3.2',
      'M6.4 12.2h3.2',
      'M15.6 11.4h.2',
      'M17.6 13.2h.2',
    ],
  },
  /* O joystick de fliperama: a bola, a haste, a base e um botão. */
  joystick: {
    paths: [
      'M12 3.4a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4Z',
      'M12 8.8v6.2',
      'M4.6 15h14.8a1.7 1.7 0 0 1 1.7 1.7v1.6a1.7 1.7 0 0 1-1.7 1.7H4.6a1.7 1.7 0 0 1-1.7-1.7v-1.6A1.7 1.7 0 0 1 4.6 15Z',
      'M17.2 11.4h.2',
    ],
  },
  /* A sacola de compras, com as alças. */
  bag: {
    paths: [
      'M5.5 8.4h13l-.9 10.4a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5.5 8.4Z',
      'M8.8 8.4V7.1a3.2 3.2 0 0 1 6.4 0v1.3',
    ],
  },
  /* O laço da caixa: dois laços, o nó e as pontas caindo. */
  ribbon: {
    paths: [
      'M11 12c-1.5-2.3-3.6-3.5-5.5-2.9-2.2.7-2.2 5.1 0 5.8 1.9.6 4-.6 5.5-2.9Z',
      'M13 12c1.5-2.3 3.6-3.5 5.5-2.9 2.2.7 2.2 5.1 0 5.8-1.9.6-4-.6-5.5-2.9Z',
      'M11 10.8h2v2.4h-2Z',
      'M10.8 13.2 9 19',
      'M13.2 13.2 15 19',
    ],
  },
  /* A caixa de presente: tampa, corpo, fita e o laço em cima. */
  gift: {
    paths: [
      'M3.6 8.6h16.8v3.4H3.6Z',
      'M5.2 12h13.6v6.6a1.8 1.8 0 0 1-1.8 1.8H7a1.8 1.8 0 0 1-1.8-1.8V12Z',
      'M12 8.6v11.8',
      'M12 8.6C10.8 5.9 8.8 4.4 7.3 5.2c-1.6.8-.8 2.9 1.2 3.4',
      'M12 8.6c1.2-2.7 3.2-4.2 4.7-3.4 1.6.8.8 2.9-1.2 3.4',
    ],
  },
  /* O espadilha, a marca do Gambit. */
  spade: {
    paths: [
      'M12 3.2c2.5 3.4 6.5 6 6.5 9.6a3.7 3.7 0 0 1-6.5 2.4 3.7 3.7 0 0 1-6.5-2.4c0-3.6 4-6.2 6.5-9.6Z',
      'M12 15.2c0 2.1.9 3.6 2.3 4.8H9.7c1.4-1.2 2.3-2.7 2.3-4.8Z',
    ],
    solid: true,
  },
  /* Duas fichas, uma sobre a outra: o emblema da carta de dobrar a aposta. */
  coins: {
    paths: [
      /* A ficha de trás: só o arco que a da frente não cobre. */
      'M15 9a5.5 5.5 0 1 0-6 6',
      'M14.5 9a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z',
      'M14.5 12.4a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Z',
    ],
  },
};

/** É o nome de um ícone daqui? (Um emoji ou símbolo solto não é.) */
export function isIconName(value: string | null | undefined): value is IconName {
  return typeof value === 'string' && Object.hasOwn(ICONS, value);
}

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
