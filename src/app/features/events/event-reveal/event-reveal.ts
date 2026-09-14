import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CELEBRATION_CONFIG } from '../../../core/config/celebration.config';
import { GiftEvent, GiftEventView } from '../../../core/models/gift-event.model';
import { GiftEventsStore } from '../../../core/state/gift-events.store';
import { vibrate } from '../../../core/utils/haptics.util';
import { keystrokeDelay } from '../../../core/utils/typewriter.util';
import { SchedulePipe } from '../../../shared/pipes/schedule.pipe';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';
import { SparkBurst } from '../../../shared/ui/spark-burst/spark-burst';
import { GiftBox } from '../gift-box/gift-box';
import { LetterEnvelope } from '../letter-envelope/letter-envelope';
import { PhotoFrame } from '../photo-frame/photo-frame';

/** Um coração solto pelo botão "Merci". */
interface Heart {
  readonly id: number;
  /** Coordenadas na viewport, medidas no botão no momento do clique. */
  readonly x: number;
  readonly y: number;
  /** 1 a 5: cada variante sobe por um caminho diferente. */
  readonly variant: number;
  readonly size: number;
  readonly delay: number;
  readonly duration: number;
}

/** Onde a máquina de escrever está: qual parágrafo, quantos caracteres. */
interface Cursor {
  readonly paragraph: number;
  readonly chars: number;
}

const HEARTS_PER_CLICK = 14;
/** Teto para quem ficar martelando o botão. */
const MAX_HEARTS = 90;
const HEART_VARIANTS = 5;

/** Cadência dos parágrafos: o primeiro entra logo, os outros um atrás do outro. */
const PARAGRAPH_DELAY_MS = 120;
const PARAGRAPH_STEP_MS = 140;
/** A foto do fim chega um compasso depois da última frase. */
const PHOTO_STEP_MS = 520;

/** No presente principal a mensagem se escreve ao vivo; o texto começa aqui. */
const TYPING_START_MS = 900;
/** Entre um parágrafo e o seguinte, a mão para um instante. */
const PARAGRAPH_BREATH_MS = 520;
/** Antes do último parágrafo, uma pausa longa: o "Vem cá." vem sozinho. */
const FINALE_PAUSE_MS = 1400;
/** O estouro do presente principal também bate no celular dela. */
const FINALE_PULSE = [40, 60, 40, 60, 120] as const;
/** Uma batida de coração quando o "Vem cá." começa a ser escrito. */
const LAST_LINE_PULSE = [24, 60, 40] as const;

/** O voo de cada carta dos cards até o leque atrás do Ás. */
const DEAL_MS = 760;
const DEAL_START_MS = 260;
const DEAL_STAGGER_MS = 95;

/**
 * A revelação de um presente.
 *
 * A entrada e a saída ficam a cargo do pai, via `animate.enter`/`animate.leave`
 * no próprio elemento. Aqui dentro cuidamos só do essencial de um diálogo:
 * foco, Escape e travar a rolagem do fundo.
 *
 * O presente principal (`finale`) abre diferente: painel dourado, o Ás no lugar
 * da carta de estrela, o estouro de naipes; as cartas dos outros presentes
 * saem voando dos cards e pousam num leque atrás do Ás ("todas as cartas na
 * mesa"); e a mensagem se escreve ao vivo, tecla por tecla, com o "Vem cá."
 * chegando por último, depois de uma pausa.
 */
@Component({
  selector: 'app-event-reveal',
  imports: [SchedulePipe, PlayingCard, SparkBurst, LetterEnvelope, GiftBox, PhotoFrame],
  templateUrl: './event-reveal.html',
  styleUrl: './event-reveal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'dismiss.emit()',
    '[class.is-finale]': 'finale()',
  },
})
export class EventReveal {
  readonly view = input.required<GiftEventView>();
  readonly dismiss = output<void>();

  protected readonly config = inject(CELEBRATION_CONFIG);
  private readonly store = inject(GiftEventsStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  protected readonly event = computed(() => this.view().event);
  protected readonly finale = computed(() => this.event().finale === true);

  /** Cada linha em branco da mensagem vira um parágrafo. */
  protected readonly paragraphs = computed(() =>
    this.event()
      .message.split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );

  /** Quando cada parágrafo entra (fora do finale, que se escreve ao vivo). */
  protected delayFor(index: number): number {
    return PARAGRAPH_DELAY_MS + index * PARAGRAPH_STEP_MS;
  }

  /** A foto do fim entra um passo depois do último parágrafo. */
  protected readonly photoDelay = computed(() =>
    this.finale() ? PHOTO_STEP_MS : this.delayFor(this.paragraphs().length - 1) + PHOTO_STEP_MS,
  );

  // --- A máquina de escrever --------------------------------------------------

  /** Onde a digitação está. Fora do finale, já no fim de tudo. */
  protected readonly cursor = signal<Cursor>({ paragraph: 0, chars: 0 });
  protected readonly typingDone = signal(false);

  /** O que já apareceu do parágrafo `index`. */
  protected typed(index: number): string {
    const { paragraph, chars } = this.cursor();
    const text = this.paragraphs()[index] ?? '';

    if (index < paragraph) return text;
    if (index > paragraph) return '';

    return text.slice(0, chars);
  }

  /** O cursor pisca no parágrafo que está sendo escrito. */
  protected writing(index: number): boolean {
    return this.finale() && !this.typingDone() && this.cursor().paragraph === index;
  }

  // --- O leque ----------------------------------------------------------------

  /** As outras cartas da mesa, na ordem da linha do tempo. */
  protected readonly hand = computed<readonly GiftEvent[]>(() =>
    this.finale() ? this.store.events().filter((event) => event.id !== this.event().id) : [],
  );

  /** As que já pousaram no leque; as outras ainda estão voando (ou nem saíram). */
  protected readonly landed = signal<ReadonlySet<string>>(new Set());

  private fliers: { element: HTMLElement; animation: Animation }[] = [];

  // --- Merci ------------------------------------------------------------------

  protected readonly hearts = signal<readonly Heart[]>([]);
  /** A batida forte do botão, no toque dela. */
  protected readonly beating = signal(false);
  private nextHeartId = 0;
  private timer?: ReturnType<typeof setTimeout>;

  /**
   * Solta um punhado de corações a partir do botão.
   *
   * A origem é medida no próprio elemento clicado, e não fixada no CSS, para
   * os corações saírem do botão onde quer que ele esteja na tela.
   */
  protected cheer(event: MouseEvent): void {
    const { left, top, width, height } = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();

    const batch = Array.from({ length: HEARTS_PER_CLICK }, () => ({
      id: this.nextHeartId++,
      x: left + width / 2,
      y: top + height / 2,
      variant: 1 + Math.floor(Math.random() * HEART_VARIANTS),
      size: 13 + Math.round(Math.random() * 18),
      delay: Math.round(Math.random() * 280),
      duration: 1500 + Math.round(Math.random() * 900),
    }));

    this.hearts.update((current) => [...current, ...batch].slice(-MAX_HEARTS));
    this.beating.set(true);
  }

  /**
   * A batida forte se desliga sozinha ao fim da própria animação, para poder
   * ser disparada de novo no toque seguinte. A onda é quem avisa: ela é a
   * última a terminar.
   */
  protected calmDown(event: AnimationEvent): void {
    if ((event.target as HTMLElement).classList.contains('thanks__wave')) {
      this.beating.set(false);
    }
  }

  /** Cada coração se remove ao fim da própria animação: sem timers. */
  protected retireHeart(id: number): void {
    this.hearts.update((current) => current.filter((heart) => heart.id !== id));
  }

  constructor() {
    afterNextRender(() => {
      this.closeButton()?.nativeElement.focus();

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.destroyRef.onDestroy(() => {
        document.body.style.overflow = previousOverflow;
      });

      if (!this.finale()) return;

      vibrate(FINALE_PULSE);
      this.deal();
      this.startTyping();
    });

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.timer);
      for (const { element, animation } of this.fliers) {
        animation.cancel();
        element.remove();
      }
      this.fliers = [];
    });
  }

  // --- Digitação --------------------------------------------------------------

  private startTyping(): void {
    // Quem pediu menos movimento recebe a mensagem pronta.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.finishTyping();
      return;
    }

    this.timer = setTimeout(() => this.typeNext(), TYPING_START_MS);
  }

  /** Escreve um caractere e marca a próxima tecla. */
  private typeNext(): void {
    const paragraphs = this.paragraphs();
    const { paragraph, chars } = this.cursor();
    const text = paragraphs[paragraph];

    if (text === undefined) {
      this.finishTyping();
      return;
    }

    if (chars < text.length) {
      this.cursor.set({ paragraph, chars: chars + 1 });
      this.timer = setTimeout(() => this.typeNext(), keystrokeDelay(text, chars));
      return;
    }

    // Fim do parágrafo. O último espera a pausa longa; os outros, um fôlego.
    const next = paragraph + 1;
    if (next >= paragraphs.length) {
      this.finishTyping();
      return;
    }

    const isLast = next === paragraphs.length - 1;
    this.timer = setTimeout(
      () => {
        if (isLast) vibrate(LAST_LINE_PULSE);
        this.cursor.set({ paragraph: next, chars: 0 });
        this.typeNext();
      },
      isLast ? FINALE_PAUSE_MS : PARAGRAPH_BREATH_MS,
    );
  }

  private finishTyping(): void {
    const paragraphs = this.paragraphs();
    const last = Math.max(0, paragraphs.length - 1);

    this.cursor.set({ paragraph: last, chars: paragraphs[last]?.length ?? 0 });
    this.typingDone.set(true);
  }

  // --- O leque ----------------------------------------------------------------

  /**
   * Tira a carta de cada card da mesa e a faz voar até o lugar dela no leque.
   *
   * Quem voa é um clone da carta do card, fixo na tela e animado pela Web
   * Animations API; a carta do leque só aparece quando o clone pousa (é o
   * mesmo truque do cabeçalho). Sem card na tela, sem `animate` ou com menos
   * movimento pedido, a carta simplesmente já está no leque.
   */
  private deal(): void {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const targets = this.host.nativeElement.querySelectorAll<HTMLElement>('.hand__card');

    targets.forEach((target, index) => {
      const id = target.dataset['hand'] ?? '';
      const source = document.querySelector<HTMLElement>(
        `app-event-card[data-event-id="${id}"] .card__emblem app-playing-card`,
      );

      if (!source || reduced || typeof source.animate !== 'function') {
        this.land(id);
        return;
      }

      const from = source.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const fromW = source.offsetWidth || from.width;
      const toW = target.offsetWidth || to.width;
      if (!fromW || !toW) {
        this.land(id);
        return;
      }

      const flier = source.cloneNode(true) as HTMLElement;
      flier.setAttribute('aria-hidden', 'true');
      flier.style.cssText = `
        position: fixed;
        left: ${from.left}px;
        top: ${from.top}px;
        width: ${fromW}px;
        height: ${source.offsetHeight || from.height}px;
        --card-w: ${fromW}px;
        --tilt-x: 0deg;
        --tilt-y: 0deg;
        margin: 0;
        z-index: 70;
        pointer-events: none;
        will-change: transform;
      `;
      document.body.append(flier);

      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const scale = toW / fromW;
      const fan = this.fanAngle(index, targets.length);

      const animation = flier.animate(
        [
          { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
          {
            // Um arco por cima, girando no caminho, como carta arremessada.
            transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(${(1 + scale) / 2}) rotate(${fan - 200}deg)`,
            offset: 0.55,
          },
          {
            transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${fan}deg)`,
            opacity: 1,
          },
        ],
        {
          duration: DEAL_MS,
          delay: DEAL_START_MS + index * DEAL_STAGGER_MS,
          easing: 'cubic-bezier(0.25, 0.85, 0.35, 1)',
          fill: 'forwards',
        },
      );

      const entry = { element: flier, animation };
      this.fliers.push(entry);

      const settle = () => {
        this.fliers = this.fliers.filter((item) => item !== entry);
        flier.remove();
        this.land(id);
      };
      animation.finished.then(settle, settle);
    });
  }

  /** O ângulo de cada carta no leque. Espelhado no SCSS (`--fan`). */
  private fanAngle(index: number, count: number): number {
    return (index - (count - 1) / 2) * 13;
  }

  private land(id: string): void {
    this.landed.update((current) => new Set(current).add(id));
  }
}
