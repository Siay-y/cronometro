import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClockService } from '../../core/services/clock.service';
import { HomePage } from './home-page';

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('mantém o relógio parado até a primeira renderização (o HTML do SSR mostra o intro)', () => {
    expect(TestBed.inject(ClockService).live()).toBe(false);
  });

  it('mostra a contagem e a área de eventos assim que o relógio começa a bater', async () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(TestBed.inject(ClockService).live()).toBe(true);
    expect(text).toContain('Contagem regressiva');
    expect(text).toContain('Área de eventos');
    expect(text).not.toContain('Embaralhando as cartas');
  });

  it('esconde o conteúdo das cartas ainda seladas', async () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('???');
    expect(text).toContain('abre em');
  });
});
