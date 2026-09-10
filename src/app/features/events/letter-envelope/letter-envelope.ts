import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { LetterPhoto, SealedLetter } from '../../../core/models/gift-event.model';
import { vibrate } from '../../../core/utils/haptics.util';
import { LetterReply } from '../letter-reply/letter-reply';

/** O lacre estala e a aba levanta. Espelhado no SCSS. */
const UNSEAL_MS = 860;
/** O papel sobe de dentro do envelope. */
const RISE_MS = 900;

/** Entrada de cada parágrafo depois que a folha se abre. */
const INK_DELAY_MS = 420;
const INK_STEP_MS = 180;

const SEAL_PULSE = 26;

type LetterPhase = 'sealed' | 'unsealing' | 'rising' | 'open' | 'sent';

/** Uma foto na pilha do albuminho, já com o lugar dela calculado. */
interface AlbumSlot {
  readonly photo: LetterPhoto;
  /** 0 é a de cima; as outras vão ficando para trás. */
  readonly depth: number;
  readonly rotate: string;
  readonly translate: string;
  readonly zIndex: number;
}

/**
 * O envelope lacrado de um presente.
 *
 * Ela vê a carta fechada, com o lacre de cera no meio. Ao apertar o botão o
 * lacre estala e some, a aba levanta girando para trás, o papel sobe de dentro
 * do bolso e a folha se abre grande, para caber o que estiver escrito nela.
 *
 * A cena é montada em 3D de verdade: os quatro pedaços do envelope vivem em
 * planos diferentes (`translateZ`) dentro de um contexto `preserve-3d`, então a
 * aba passa por cima da frente e termina atrás do corpo sozinha, pela própria
 * geometria, sem ninguém remendar ordem de pintura no meio da animação.
 */
@Component({
  selector: 'app-letter-envelope',
  imports: [LetterReply],
  templateUrl: './letter-envelope.html',
  styleUrl: './letter-envelope.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-unsealed]': "phase() !== 'sealed'",
    '[class.is-rising]': "phase() === 'rising' || phase() === 'open'",
    '[class.is-open]': "phase() === 'open'",
  },
})
export class LetterEnvelope {
  readonly letter = input.required<SealedLetter>();
  /** Identifica a carta, para o rascunho da resposta dela não se misturar. */
  readonly letterId = input('carta');

  protected readonly phase = signal<LetterPhase>('sealed');
  protected readonly opened = computed(() => this.phase() === 'open');
  /** Ela mandou o textinho: a carta se fecha e fica o aviso no lugar dela. */
  protected readonly posted = computed(() => this.phase() === 'sent');

  /** Cada linha em branco do corpo vira um parágrafo, como no card. */
  protected readonly paragraphs = computed(() =>
    this.letter()
      .body.split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );

  /** Fotos que ainda não falharam ao carregar. Ver `dropPhoto`. */
  private readonly missing = signal<ReadonlySet<string>>(new Set());

  protected readonly photos = computed(() =>
    (this.letter().photos ?? []).filter((photo) => !this.missing().has(photo.src)),
  );

  /** Qual foto está por cima da pilha. */
  private readonly top = signal(0);

  protected readonly album = computed<AlbumSlot[]>(() => {
    const photos = this.photos();
    const top = this.top() % Math.max(photos.length, 1);

    return photos.map((photo, index) => {
      const depth = (index - top + photos.length) % photos.length;

      return {
        photo,
        depth,
        // Cada foto de baixo aparece um pouco torta, como pilha na mesa.
        rotate: `${(depth === 0 ? -1.5 : (depth % 2 ? 1 : -1) * (2.5 + depth * 1.6)).toFixed(1)}deg`,
        translate: `0 ${(depth * 5).toFixed(0)}px`,
        zIndex: photos.length - depth,
      };
    });
  });

  private readonly current = computed(() => this.album().find((slot) => slot.depth === 0));

  protected readonly caption = computed(() => this.current()?.photo.caption ?? '');

  /** "2 de 3". Vazio quando só existe uma foto, que não vira pilha. */
  protected readonly counter = computed(() => {
    const total = this.photos().length;

    return total > 1 ? `${(this.top() % total) + 1} de ${total}` : '';
  });

  /** A tinta seca de cima para baixo: o fecho só aparece depois do texto. */
  protected readonly albumDelay = computed(
    () => INK_DELAY_MS + this.paragraphs().length * INK_STEP_MS,
  );
  protected readonly closingDelay = computed(
    () => this.albumDelay() + (this.photos().length ? INK_STEP_MS : 0),
  );
  protected readonly signDelay = computed(() => this.closingDelay() + INK_STEP_MS);
  /** A folha em branco dela só aparece depois que a assinatura foi carimbada. */
  protected readonly replyDelay = computed(() => this.signDelay() + 1200);

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimers());
  }

  protected unseal(): void {
    if (this.phase() !== 'sealed') return;

    // Quem pediu menos movimento recebe a carta já aberta: o conteúdo é o
    // presente, e a encenação não pode ser pedágio para chegar nele.
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.phase.set('open');
      return;
    }

    this.phase.set('unsealing');
    vibrate(SEAL_PULSE);

    this.timers.push(
      setTimeout(() => this.phase.set('rising'), UNSEAL_MS),
      setTimeout(() => this.phase.set('open'), UNSEAL_MS + RISE_MS),
    );
  }

  /** A carta se dobra e se fecha quando o textinho dela vai embora. */
  protected onSent(): void {
    this.clearTimers();
    this.phase.set('sent');
  }

  /** Passa a foto de cima para o fim da pilha. */
  protected nextPhoto(): void {
    if (this.photos().length < 2) return;

    this.top.update((current) => (current + 1) % this.photos().length);
  }

  /**
   * Uma foto cujo arquivo não existe sai da pilha em silêncio, em vez de virar
   * um ícone de imagem quebrada no meio da carta. É o que deixa a lista de
   * fotos ser escrita antes de os arquivos serem colocados na pasta.
   */
  protected dropPhoto(src: string): void {
    this.missing.update((current) => new Set(current).add(src));
    this.top.set(0);
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
