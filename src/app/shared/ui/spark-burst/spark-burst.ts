import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

interface Spark {
  readonly id: number;
  readonly angle: number;
  readonly delay: number;
  /** Alcance do estilhaço, resolvido por classe, não por variável inline. */
  readonly reach: 'near' | 'mid' | 'far';
  readonly glyph: string;
}

const GLYPHS = ['♠', '♥', '♦', '♣', '✦'] as const;
const REACHES = ['near', 'mid', 'far'] as const;

/** Explosão determinística: mesmo desenho no servidor e no navegador. */
const SPARKS: readonly Spark[] = Array.from({ length: 28 }, (_, id) => ({
  id,
  angle: Math.round((360 / 28) * id),
  delay: (id % 7) * 90,
  reach: REACHES[id % REACHES.length],
  glyph: GLYPHS[id % GLYPHS.length],
}));

/**
 * O estouro de naipes: 28 estilhaços saindo do centro, sem parar, em volta do
 * que for projetado dentro (uma carta, em geral). É a comemoração da meia-noite
 * e a abertura do presente principal, então mora aqui e não em cada uma.
 *
 * `tight` encolhe o alcance para caber dentro de um painel que rola: fora dele,
 * os estilhaços passariam da borda e virariam rolagem.
 */
@Component({
  selector: 'app-spark-burst',
  templateUrl: './spark-burst.html',
  styleUrl: './spark-burst.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-tight]': 'tight()' },
})
export class SparkBurst {
  readonly tight = input(false, { transform: booleanAttribute });

  protected readonly sparks = SPARKS;
}
