import { computed, DestroyRef, inject, Injectable, afterNextRender, signal } from '@angular/core';

const TICK_MS = 1000;

/**
 * Fonte única de "agora" para toda a aplicação.
 *
 * O relógio só começa a bater depois da primeira renderização no navegador:
 * assim o HTML gerado no servidor (SSR) e o primeiro render do cliente são
 * idênticos (nada de divergência de hidratação) e o `setInterval` nunca roda
 * durante o prerender.
 *
 * `offsetMs` existe para a "viagem no tempo" do painel: ele desloca o agora
 * para testar como os presentes vão se comportar, sem mexer no relógio do SO.
 */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly tick = signal(Date.now());
  private readonly offset = signal(0);
  private readonly running = signal(false);

  /** Instante atual (já com o deslocamento da viagem no tempo aplicado). */
  readonly now = computed(() => this.tick() + this.offset());

  /** `true` assim que o relógio passa a bater no navegador. */
  readonly live = this.running.asReadonly();

  /** Deslocamento ativo, em ms. Zero quando o relógio segue o horário real. */
  readonly offsetMs = this.offset.asReadonly();

  readonly timeTravelling = computed(() => this.offset() !== 0);

  constructor() {
    afterNextRender(() => this.start());
  }

  /** Simula um instante específico. `null` volta ao horário real. */
  travelTo(target: Date | null): void {
    this.offset.set(target ? target.getTime() - Date.now() : 0);
  }

  /** Adianta (ou atrasa, com valor negativo) o agora simulado. */
  travelBy(deltaMs: number): void {
    this.offset.update((current) => current + deltaMs);
  }

  private start(): void {
    this.tick.set(Date.now());
    this.running.set(true);

    const handle = setInterval(() => this.tick.set(Date.now()), TICK_MS);
    this.destroyRef.onDestroy(() => clearInterval(handle));
  }
}
