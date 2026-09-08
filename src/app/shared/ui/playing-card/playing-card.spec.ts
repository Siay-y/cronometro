import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayingCard } from './playing-card';

describe('PlayingCard', () => {
  let fixture: ComponentFixture<PlayingCard>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlayingCard] }).compileComponents();

    fixture = TestBed.createComponent(PlayingCard);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;

    // jsdom não faz layout: sem um retângulo, não há como situar o ponteiro.
    host.getBoundingClientRect = () => ({ left: 100, top: 200, width: 80, height: 112 }) as DOMRect;
  });

  it('nasce em repouso, sem inclinação', () => {
    expect(host.classList.contains('is-tilting')).toBe(false);
    expect(host.querySelector('.foil')).toBeTruthy();
    expect(host.querySelector('.glare')).toBeTruthy();
  });

  it('inclina para o lado em que o dedo encosta', () => {
    // Canto inferior direito da carta.
    fixture.componentInstance.tiltTo(180, 312);

    expect(host.classList.contains('is-tilting')).toBe(true);
    expect(parseFloat(host.style.getPropertyValue('--tilt-y'))).toBeGreaterThan(0);
    expect(parseFloat(host.style.getPropertyValue('--tilt-x'))).toBeLessThan(0);
    expect(host.style.getPropertyValue('--shine-x')).toBe('100.0%');
  });

  it('inclina para o outro lado no canto oposto', () => {
    fixture.componentInstance.tiltTo(100, 200);

    expect(parseFloat(host.style.getPropertyValue('--tilt-y'))).toBeLessThan(0);
    expect(parseFloat(host.style.getPropertyValue('--tilt-x'))).toBeGreaterThan(0);
  });

  it('não deixa a inclinação passar do limite, mesmo fora da carta', () => {
    fixture.componentInstance.tiltTo(9999, 9999);

    expect(parseFloat(host.style.getPropertyValue('--tilt-y'))).toBeLessThanOrEqual(11);
    expect(parseFloat(host.style.getPropertyValue('--tilt-x'))).toBeGreaterThanOrEqual(-11);
  });

  it('volta ao repouso quando o dedo sai', () => {
    fixture.componentInstance.tiltTo(180, 312);
    fixture.componentInstance.resetTilt();

    expect(host.classList.contains('is-tilting')).toBe(false);
    expect(host.style.getPropertyValue('--tilt-x')).toBe('0deg');
    expect(host.style.getPropertyValue('--tilt-y')).toBe('0deg');
  });

  it('ignora coordenadas inválidas em vez de escrever NaN no estilo', () => {
    fixture.componentInstance.tiltTo(Number.NaN, Number.NaN);

    expect(host.classList.contains('is-tilting')).toBe(false);
    expect(host.style.getPropertyValue('--tilt-x')).toBe('');
  });
});
