import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GiftEventView } from '../../../core/models/gift-event.model';
import { vibrate } from '../../../core/utils/haptics.util';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { SchedulePipe } from '../../../shared/pipes/schedule.pipe';
import { Icon } from '../../../shared/ui/icon/icon';
import { PlayingCard } from '../../../shared/ui/playing-card/playing-card';

/** Quanto tempo de dedo na tela até a carta detonar. Espelhado no SCSS. */
const CHARGE_MS = 1200;

/** Pulsos que aceleram enquanto a carga sobe (vibra, pausa, vibra, pausa...). */
const CHARGE_PULSES = [8, 150, 12, 140, 16, 130, 20, 110, 26, 90, 34, 70, 44] as const;
const DETONATION_PULSE = 70;

/**
 * Um presente na linha do tempo.
 *
 * O card é "burro" quanto às regras de tempo: recebe a projeção pronta
 * (`GiftEventView`) e só avisa o pai quando ela quer abrir.
 *
 * A abertura tem duas formas. Uma carta disponível e ainda fechada precisa ser
 * *carregada*: ela pressiona e segura, a energia sobe, e a carta detona — o
 * gesto do próprio Gambit. Depois de aberta (ou pelo teclado), volta a ser um
 * toque simples, para reler não virar pedágio.
 */
@Component({
  selector: 'app-event-card',
  imports: [PlayingCard, Icon, DurationPipe, SchedulePipe],
  templateUrl: './event-card.html',
  styleUrl: './event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"is-" + view().phase',
    '[class.accent-violet]': 'view().event.accent === "violet"',
    '[class.accent-gold]': 'view().event.accent === "gold"',
    '[class.is-charging]': 'charging()',
    '[class.is-detonating]': 'detonating()',
  },
})
export class EventCard {
  readonly view = input.required<GiftEventView>();
  readonly reveal = output<GiftEventView>();

  /** Recusa animada quando ela tenta abrir antes da hora. */
  protected readonly nudging = signal(false);
  protected readonly charging = signal(false);
  protected readonly detonating = signal(false);

  protected readonly event = computed(() => this.view().event);
  protected readonly sealed = computed(() => this.view().phase === 'sealed');
  protected readonly live = computed(() => this.view().phase === 'live');
  protected readonly isNew = computed(() => !this.sealed() && !this.view().opened);

  /** Só a primeira abertura de uma carta disponível pede o ritual da carga. */
  protected readonly needsCharge = computed(() => this.live() && !this.view().opened);

  /** Quanto da janela de destaque já passou; alimenta a barra do card. */
  protected readonly remainingRatio = computed(() => 1 - this.view().windowProgress);

  private readonly emblem = viewChild(PlayingCard);
  private timer?: ReturnType<typeof setTimeout>;
  /** Marca que o dedo já cuidou desta interação, para o clique seguinte não repetir. */
  private handledByPointer = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopCharging());
  }

  protected pressStart(event: PointerEvent): void {
    // A carta se vira na direção do dedo assim que ele encosta.
    this.emblem()?.tiltTo(event.clientX, event.clientY);

    if (!this.needsCharge()) return;

    this.handledByPointer = true;
    this.charging.set(true);
    vibrate(CHARGE_PULSES);
    this.timer = setTimeout(() => this.detonate(), CHARGE_MS);
  }

  /** Soltar antes da hora descarrega a carta — mais rápido do que ela carregou. */
  protected pressEnd(): void {
    this.emblem()?.resetTilt();

    if (!this.charging()) return;

    this.stopCharging();
    vibrate(0);
  }

  /**
   * O clique cobre o toque simples e, de graça, o teclado: Enter e Espaço
   * disparam `click` sem nenhum `pointerdown` antes, então quem navega pelo
   * teclado abre a carta direto, sem precisar segurar nada.
   */
  protected select(): void {
    if (this.handledByPointer) {
      this.handledByPointer = false;
      return;
    }

    if (this.sealed()) {
      this.nudging.set(true);
      return;
    }

    this.reveal.emit(this.view());
  }

  /** O clarão e a recusa se apagam sozinhos ao fim das próprias animações. */
  protected onAnimationEnd(event: AnimationEvent): void {
    if ((event.target as HTMLElement).classList.contains('flash')) {
      this.detonating.set(false);
      return;
    }

    this.nudging.set(false);
  }

  private detonate(): void {
    this.stopCharging();
    this.detonating.set(true);
    vibrate(DETONATION_PULSE);
    this.reveal.emit(this.view());
  }

  private stopCharging(): void {
    clearTimeout(this.timer);
    this.charging.set(false);
  }
}
