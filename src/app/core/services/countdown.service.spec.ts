import { TestBed } from '@angular/core/testing';
import { ClockService } from './clock.service';
import { CountdownService } from './countdown.service';

describe('CountdownService', () => {
  let countdown: CountdownService;
  let clock: ClockService;

  beforeEach(() => {
    countdown = TestBed.inject(CountdownService);
    clock = TestBed.inject(ClockService);
  });

  afterEach(() => clock.travelTo(null));

  /**
   * O relógio simulado fica alguns milissegundos atrás do instante pedido (a
   * batida dele é a da criação, não a de agora), então os instantes aqui
   * caem no meio de um segundo, nunca em cima da virada.
   */
  function at(when: string): void {
    clock.travelTo(new Date(when));
  }

  it('atravessa a jornada inteira, do dia comum à chegada', () => {
    at('2026-09-05T12:00');
    expect(countdown.stage()).toBe('journey');

    at('2026-09-14T00:00:01.500');
    expect(countdown.stage()).toBe('eve');

    at('2026-09-14T23:00:01.500');
    expect(countdown.stage()).toBe('last-hour');

    at('2026-09-14T23:59:51.500');
    expect(countdown.stage()).toBe('final');

    at('2026-09-15T00:00:00.500');
    expect(countdown.stage()).toBe('arrived');
  });

  it('ainda é véspera enquanto sobra uma hora inteira', () => {
    at('2026-09-14T22:59:59.500');
    expect(countdown.stage()).toBe('eve');
  });

  it('esquenta a última hora de zero a um, e só ela', () => {
    at('2026-09-14T18:00');
    expect(countdown.heat()).toBe(0);

    at('2026-09-14T22:59:59.500');
    expect(countdown.heat()).toBe(0);

    at('2026-09-14T23:30');
    expect(countdown.heat()).toBeCloseTo(0.5, 3);

    at('2026-09-15T00:00:00.500');
    expect(countdown.heat()).toBe(0);
  });
});
