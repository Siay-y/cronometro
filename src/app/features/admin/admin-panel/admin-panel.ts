import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GiftAccent,
  GiftEvent,
  GiftEventView,
  SealedLetter,
} from '../../../core/models/gift-event.model';
import { ClockService } from '../../../core/services/clock.service';
import { CountdownService } from '../../../core/services/countdown.service';
import { GiftEventsStore } from '../../../core/state/gift-events.store';
import { createId } from '../../../core/utils/id.util';
import { DAY_MS, HOUR_MS, toLocalDateTimeInput } from '../../../core/utils/time.util';
import { SchedulePipe } from '../../../shared/pipes/schedule.pipe';

/** Formulário em edição. `id` nulo significa "carta nova". */
interface GiftDraft {
  id: string | null;
  title: string;
  teaser: string;
  message: string;
  icon: string;
  accent: GiftAccent;
  opensAt: string;
  durationMinutes: number;
  /**
   * A carta lacrada não se edita por aqui: ela viaja junto só para sobreviver
   * ao salvamento. Sem isto, editar a data de um presente pelo painel apagaria
   * em silêncio o envelope escrito no arquivo de dados.
   */
  letter?: SealedLetter;
}

function emptyDraft(): GiftDraft {
  return {
    id: null,
    title: '',
    teaser: '',
    message: '',
    icon: '🎁',
    accent: 'magenta',
    opensAt: toLocalDateTimeInput(Date.now() + HOUR_MS),
    durationMinutes: 1440,
  };
}

/**
 * Painel escondido (5 toques no naipe do rodapé). Só para você.
 *
 * Faz três coisas: monta a lista de presentes, viaja no tempo para conferir
 * como cada carta vai se comportar, e exporta tudo como código para colar em
 * `gift-events.data.ts`.
 */
@Component({
  selector: 'app-admin-panel',
  imports: [FormsModule, SchedulePipe],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close.emit()' },
})
export class AdminPanel {
  private readonly store = inject(GiftEventsStore);
  private readonly clock = inject(ClockService);
  private readonly countdown = inject(CountdownService);

  readonly close = output<void>();

  protected readonly accents: readonly GiftAccent[] = ['magenta', 'violet', 'gold'];
  protected readonly views = this.store.views;
  protected readonly usingCustomList = this.store.usingCustomList;
  protected readonly timeTravelling = this.clock.timeTravelling;
  protected readonly now = this.clock.now;

  protected readonly draft = signal<GiftDraft>(emptyDraft());
  protected readonly editing = computed(() => this.draft().id !== null);
  protected readonly canSave = computed(
    () => this.draft().title.trim().length > 0 && this.draft().opensAt.length > 0,
  );

  protected readonly travelTarget = signal(toLocalDateTimeInput(this.clock.now()));
  protected readonly feedback = signal<string | null>(null);

  protected patch(part: Partial<GiftDraft>): void {
    this.draft.update((current) => ({ ...current, ...part }));
  }

  protected edit(view: GiftEventView): void {
    const { id, title, teaser, message, icon, accent, opensAt, durationMinutes, letter } =
      view.event;
    this.draft.set({ id, title, teaser, message, icon, accent, opensAt, durationMinutes, letter });
  }

  protected resetDraft(): void {
    this.draft.set(emptyDraft());
  }

  protected save(): void {
    if (!this.canSave()) return;

    const draft = this.draft();
    const event: GiftEvent = {
      id: draft.id ?? createId(),
      title: draft.title.trim(),
      teaser: draft.teaser.trim(),
      message: draft.message.trim(),
      icon: draft.icon.trim() || '🎁',
      accent: draft.accent,
      opensAt: draft.opensAt,
      durationMinutes: Math.max(1, Math.round(draft.durationMinutes)),
      ...(draft.letter ? { letter: draft.letter } : {}),
    };

    this.store.upsert(event);
    this.resetDraft();
    this.announce(draft.id ? 'Carta atualizada.' : 'Carta adicionada à mesa.');
  }

  protected remove(view: GiftEventView): void {
    this.store.remove(view.event.id);

    if (this.draft().id === view.event.id) this.resetDraft();
    this.announce('Carta removida.');
  }

  protected restoreDefaults(): void {
    this.store.restoreDefaults();
    this.resetDraft();
    this.announce('Lista original restaurada.');
  }

  protected clearOpened(): void {
    this.store.clearOpened();
    this.announce('Todas as cartas foram re-seladas.');
  }

  protected async copyAsCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.store.toSourceCode());
      this.announce('Código copiado! Cole em gift-events.data.ts.');
    } catch {
      this.announce('Não consegui copiar. Verifique a permissão do navegador.');
    }
  }

  // --- Viagem no tempo ------------------------------------------------------

  protected applyTravel(): void {
    this.clock.travelTo(new Date(this.travelTarget()));
    this.announce('Relógio simulado.');
  }

  protected jump(deltaMs: number): void {
    this.clock.travelBy(deltaMs);
    this.travelTarget.set(toLocalDateTimeInput(this.clock.now()));
  }

  protected jumpToBirthday(): void {
    this.clock.travelTo(new Date(this.countdown.targetMs + 1000));
    this.travelTarget.set(toLocalDateTimeInput(this.clock.now()));
    this.announce('Modo aniversário ligado.');
  }

  protected resetClock(): void {
    this.clock.travelTo(null);
    this.travelTarget.set(toLocalDateTimeInput(Date.now()));
    this.announce('De volta ao horário real.');
  }

  protected readonly hourMs = HOUR_MS;
  protected readonly dayMs = DAY_MS;

  private feedbackTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.feedbackTimer));
  }

  private announce(message: string): void {
    clearTimeout(this.feedbackTimer);
    this.feedback.set(message);
    this.feedbackTimer = setTimeout(() => this.feedback.set(null), 2600);
  }
}
