import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { ReplyInvite } from '../../../core/models/gift-event.model';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { vibrate } from '../../../core/utils/haptics.util';
import { Icon } from '../../../shared/ui/icon/icon';

/** Dedo no lacre até a cera fechar a carta. Espelhado no SCSS. */
const SEAL_MS = 1200;
/** Menos que isto escrito e o lacre nem acende: carta vazia não se lacra. */
const MIN_CHARS = 2;

/** O carimbo bate no selo; a carta só se fecha depois que ele secou. */
const STAMP_MS = 620;

const CHARGE_PULSES = [8, 150, 12, 140, 16, 130, 20, 110, 26, 90, 34, 70, 44] as const;
const SEALED_PULSE = 70;
const STAMP_PULSE = [40, 60, 90] as const;

type ReplyPhase = 'writing' | 'sealing' | 'sealed' | 'sent';

/**
 * A resposta dela.
 *
 * O site inteiro fala com ela e ela só escuta. Aqui a mão troca de lado: no fim
 * da carta aparece uma folha em branco na mesma pauta do papel, ela escreve o
 * que quiser, segura o lacre até a cera fechar (o mesmo gesto de carregar que
 * abre os presentes) e o texto vira uma mensagem pronta para mandar.
 *
 * O rascunho é guardado no navegador dela a cada tecla, então dá para começar
 * hoje, fechar a página e terminar amanhã. E o lacre também fica guardado: se
 * ela voltar depois de lacrar, a carta continua lacrada, esperando ser enviada.
 */
@Component({
  selector: 'app-letter-reply',
  imports: [Icon],
  templateUrl: './letter-reply.html',
  styleUrl: './letter-reply.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-sealing]': "phase() === 'sealing'",
    '[class.is-sealed]': "phase() === 'sealed'",
    '[class.is-sent]': "phase() === 'sent'",
  },
})
export class LetterReply {
  readonly invite = input.required<ReplyInvite>();
  /** Identifica a carta, para cada uma ter o seu rascunho. */
  readonly storageKey = input.required<string>();
  /** Avisa a carta de que o textinho foi. Ela se fecha ao ouvir isto. */
  readonly sent = output<void>();

  private readonly storage = inject(LocalStorageService);

  private readonly draftKey = computed(() => `mon-cher:resposta:${this.storageKey()}`);
  private readonly sealKey = computed(() => `mon-cher:resposta-lacrada:${this.storageKey()}`);
  private readonly sentKey = computed(() => `mon-cher:resposta-enviada:${this.storageKey()}`);

  /**
   * O que ela escreveu, semeado do que estava guardado. Como é um
   * `linkedSignal`, trocar de carta troca o rascunho sozinho, sem efeito
   * nenhum no meio do caminho.
   */
  protected readonly text = linkedSignal<string, string>({
    source: this.draftKey,
    computation: (key) => this.storage.read(key, ''),
  });

  protected readonly phase = linkedSignal<string, ReplyPhase>({
    source: this.storageKey,
    computation: () => {
      if (this.storage.read(this.sentKey(), false)) return 'sent';

      return this.storage.read(this.sealKey(), false) ? 'sealed' : 'writing';
    },
  });

  /** O carimbo batendo no selo, entre o toque dela e a carta se fechar. */
  protected readonly stamping = signal(false);

  protected readonly sealed = computed(
    () => this.phase() !== 'writing' && this.phase() !== 'sealing',
  );
  protected readonly wasSent = computed(() => this.phase() === 'sent');
  /** O carimbo, batendo agora ou já batido numa visita anterior. */
  protected readonly stamped = computed(() => this.stamping() || this.wasSent());
  protected readonly canSeal = computed(() => this.text().trim().length >= MIN_CHARS);

  protected readonly words = computed(() => {
    const words = this.text().trim().split(/\s+/).filter(Boolean).length;

    return words === 1 ? '1 palavra' : `${words} palavras`;
  });

  private timer?: ReturnType<typeof setTimeout>;
  /** Marca que o dedo já cuidou desta interação, para o clique não repetir. */
  private handledByPointer = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** Guarda a cada tecla: fechar a página no meio de uma frase não custa nada. */
  protected write(value: string): void {
    this.text.set(value);
    this.storage.write(this.draftKey(), value);
  }

  protected pressStart(): void {
    if (this.phase() !== 'writing' || !this.canSeal()) return;

    this.handledByPointer = true;
    this.phase.set('sealing');
    vibrate(CHARGE_PULSES);
    this.timer = setTimeout(() => this.seal(), SEAL_MS);
  }

  /** Soltar antes da hora esfria a cera, e a carta continua aberta. */
  protected pressEnd(): void {
    if (this.phase() !== 'sealing') return;

    clearTimeout(this.timer);
    this.phase.set('writing');
    vibrate(0);
  }

  /** Enter e Espaço disparam `click` sem `pointerdown`: pelo teclado, lacra direto. */
  protected select(): void {
    if (this.handledByPointer) {
      this.handledByPointer = false;
      return;
    }

    if (this.phase() === 'writing' && this.canSeal()) this.seal();
  }

  /**
   * O carimbo bate no selo e, quando ele seca, a carta se fecha (quem cuida
   * disso é quem ouve o `sent`).
   *
   * Nada sai do aparelho dela: o textinho fica guardado aqui mesmo, e é no
   * painel escondido que ele é lido.
   */
  protected send(): void {
    if (this.phase() !== 'sealed' || this.stamping()) return;

    this.stamping.set(true);
    this.storage.write(this.sentKey(), true);
    vibrate(STAMP_PULSE);

    this.timer = setTimeout(() => {
      this.phase.set('sent');
      this.sent.emit();
    }, STAMP_MS);
  }

  /** Nada aqui é definitivo: ela pode quebrar o próprio lacre e reescrever. */
  protected reopen(): void {
    clearTimeout(this.timer);
    this.stamping.set(false);
    this.phase.set('writing');
    this.storage.write(this.sealKey(), false);
    this.storage.write(this.sentKey(), false);
  }

  private seal(): void {
    this.phase.set('sealed');
    this.storage.write(this.sealKey(), true);
    vibrate(SEALED_PULSE);
  }
}
