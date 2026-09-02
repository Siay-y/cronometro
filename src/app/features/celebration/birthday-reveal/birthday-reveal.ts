import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';

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

/** O que substitui a contagem quando o relógio zera: a carta finalmente estoura. */
@Component({
  selector: 'app-birthday-reveal',
  imports: [PlayingCard],
  templateUrl: './birthday-reveal.html',
  styleUrl: './birthday-reveal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BirthdayReveal {
  protected readonly config = inject(CELEBRATION_CONFIG);
  protected readonly sparks = SPARKS;
}
