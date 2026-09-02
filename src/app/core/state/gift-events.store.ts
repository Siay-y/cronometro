import { computed, inject, Injectable, signal } from '@angular/core';
import { GIFT_EVENTS } from '../../data/gift-events.data';
import { GiftEvent, GiftEventView } from '../models/gift-event.model';
import { ClockService } from '../services/clock.service';
import { LocalStorageService } from '../services/local-storage.service';
import { byOpensAt, describeGiftEvent } from '../utils/gift-event.util';

const LIST_KEY = 'mon-cher:gift-events:v1';
const OPENED_KEY = 'mon-cher:opened-gifts:v1';

/**
 * Fonte de verdade dos presentes.
 *
 * A lista base vem do arquivo de dados; se o painel editar alguma coisa, a
 * lista inteira passa a viver no `localStorage` (e `restoreDefaults()` desfaz
 * isso). O que ela já abriu também é persistido, para o card não "re-selar" a
 * cada visita.
 */
@Injectable({ providedIn: 'root' })
export class GiftEventsStore {
  private readonly clock = inject(ClockService);
  private readonly storage = inject(LocalStorageService);

  /** `null` = ainda usando a lista padrão do código. */
  private readonly overrides = signal<GiftEvent[] | null>(
    this.storage.read<GiftEvent[] | null>(LIST_KEY, null),
  );
  private readonly openedIds = signal<ReadonlySet<string>>(
    new Set(this.storage.read<string[]>(OPENED_KEY, [])),
  );

  readonly usingCustomList = computed(() => this.overrides() !== null);

  readonly events = computed<readonly GiftEvent[]>(() =>
    [...(this.overrides() ?? GIFT_EVENTS)].sort(byOpensAt),
  );

  /** Os presentes já projetados no instante atual: é o que a interface consome. */
  readonly views = computed<readonly GiftEventView[]>(() => {
    const now = this.clock.now();
    const opened = this.openedIds();

    return this.events().map((event) => describeGiftEvent(event, now, opened.has(event.id)));
  });

  /** O próximo a destravar; alimenta o aviso "próxima em ...". */
  readonly nextToOpen = computed<GiftEventView | null>(
    () => this.views().find((view) => view.phase === 'sealed') ?? null,
  );

  readonly openedCount = computed(() => this.views().filter((view) => view.opened).length);

  markOpened(id: string): void {
    if (this.openedIds().has(id)) return;

    const next = new Set(this.openedIds());
    next.add(id);
    this.openedIds.set(next);
    this.storage.write(OPENED_KEY, [...next]);
  }

  /** Cria ou atualiza um presente (usado pelo painel). */
  upsert(event: GiftEvent): void {
    const current = [...this.events()];
    const index = current.findIndex((item) => item.id === event.id);

    if (index >= 0) {
      current[index] = event;
    } else {
      current.push(event);
    }

    this.commit(current);
  }

  remove(id: string): void {
    this.commit(this.events().filter((event) => event.id !== id));
  }

  /** Volta para a lista escrita em `gift-events.data.ts`. */
  restoreDefaults(): void {
    this.overrides.set(null);
    this.storage.remove(LIST_KEY);
  }

  /** Re-sela tudo: útil para conferir as animações de abertura. */
  clearOpened(): void {
    this.openedIds.set(new Set());
    this.storage.remove(OPENED_KEY);
  }

  /** Serializa a lista atual no formato do arquivo de dados. */
  toSourceCode(): string {
    const body = this.events()
      .map((event) => `  ${JSON.stringify(event, null, 2).replace(/\n/g, '\n  ')},`)
      .join('\n');

    return `export const GIFT_EVENTS: readonly GiftEvent[] = [\n${body}\n];\n`;
  }

  private commit(events: readonly GiftEvent[]): void {
    const sorted = [...events].sort(byOpensAt);
    this.overrides.set(sorted);
    this.storage.write(LIST_KEY, sorted);
  }
}
