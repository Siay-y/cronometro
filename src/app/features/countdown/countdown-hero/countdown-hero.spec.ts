import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ClockService } from '../../../core/services/clock.service';
import { CountdownHero } from './countdown-hero';

describe('CountdownHero', () => {
  let fixture: ComponentFixture<CountdownHero>;
  let host: HTMLElement;
  let clock: ClockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CountdownHero] }).compileComponents();

    clock = TestBed.inject(ClockService);
    fixture = TestBed.createComponent(CountdownHero);
    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    clock.travelTo(null);
    delete (navigator as { vibrate?: unknown }).vibrate;
  });

  /** Instantes no meio do segundo: o relógio simulado fica uns ms atrás do pedido. */
  function at(when: string): void {
    clock.travelTo(new Date(when));
    fixture.detectChanges();
  }

  function labels(): string[] {
    return [...host.querySelectorAll('.unit__label')].map(
      (label) => label.textContent?.trim() ?? '',
    );
  }

  it('conta em dias enquanto ainda faltam dias', () => {
    at('2026-09-05T12:00');

    expect(labels()).toEqual(['Dias', 'Horas', 'Min', 'Seg']);
    expect(host.textContent).toContain('Contagem regressiva');
    expect(host.textContent).toContain('até o dia 15');
    expect(host.classList.contains('is-eve')).toBe(false);
    expect(host.querySelector('.charge__sparks')).toBeNull();
  });

  it('na véspera tira os dias do relógio e avisa que é amanhã', () => {
    at('2026-09-14T18:00');

    expect(labels()).toEqual(['Horas', 'Min', 'Seg']);
    expect(host.textContent).toContain('É amanhã');
    expect(host.textContent).toContain('até a meia-noite');
    expect(host.classList.contains('is-eve')).toBe(true);
    // A energia passou do limite: a legenda muda e as fagulhas aparecem.
    expect(host.textContent).toContain('Quase estourando');
    expect(host.querySelector('.charge__sparks')).toBeTruthy();
  });

  it('na última hora põe a carta para tremer, mais quente a cada minuto', () => {
    at('2026-09-14T23:15');

    const card = host.querySelector<HTMLElement>('.hero__card')!;

    expect(host.classList.contains('is-last-hour')).toBe(true);
    expect(host.textContent).toContain('Falta menos de uma hora');
    expect(Number(card.style.getPropertyValue('--heat'))).toBeCloseTo(0.25, 3);
  });

  it('nos últimos dez segundos conta em voz alta na tela inteira', () => {
    at('2026-09-14T23:59:52.500');

    expect(host.querySelector('.finale')).toBeTruthy();
    expect(host.querySelector('.finale__second')?.textContent?.trim()).toBe('7');
    expect(host.textContent).toContain('É agora');

    at('2026-09-14T23:59:53.500');
    expect(host.querySelector('.finale__second')?.textContent?.trim()).toBe('6');
  });

  it('bate no celular a cada segundo da contagem final, e só nela', () => {
    // O jsdom não tem `vibrate`: o utilitário só chama quando ele existe.
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });

    at('2026-09-14T23:59:00.500');
    expect(vibrate).not.toHaveBeenCalled();

    at('2026-09-14T23:59:55.500');
    expect(vibrate).toHaveBeenCalledTimes(1);

    at('2026-09-14T23:59:56.500');
    expect(vibrate).toHaveBeenCalledTimes(2);
  });
});
