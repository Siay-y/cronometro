import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
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

  it('mantém o cabeçalho recolhido enquanto a carta está à vista', async () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('app-floating-header') as HTMLElement;

    expect(header).toBeTruthy();
    expect(header.classList.contains('is-pinned')).toBe(false);
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

/**
 * Reproduz a sequência exata do navegador: o retorno de chamada do observador
 * chega fora do ciclo do Angular, sem nenhuma detecção de mudanças no meio.
 * Foi assim que o cabeçalho quebrou (NG0951) e sumiu da tela por completo.
 */
describe('HomePage: cabeçalho ao rolar', () => {
  let notify: (entries: unknown[]) => void;
  let flights: number;

  beforeEach(async () => {
    flights = 0;

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: unknown[]) => void) {
          notify = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    Element.prototype.animate = () => {
      flights++;
      return {
        finished: new Promise<void>(() => {}),
        cancel: () => undefined,
      } as unknown as Animation;
    };
    Element.prototype.getBoundingClientRect = () =>
      ({ left: 40, top: -20, width: 100, height: 140 }) as DOMRect;

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => vi.unstubAllGlobals());

  async function mount() {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  }

  it('mostra o cabeçalho e arremessa a carta sem estourar', async () => {
    const fixture = await mount();

    // Sem `detectChanges()` antes: é o navegador falando, não o Angular.
    expect(() =>
      notify([{ boundingClientRect: { top: -60 }, intersectionRatio: 0.4 }]),
    ).not.toThrow();
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('app-floating-header') as HTMLElement;

    expect(header.classList.contains('is-pinned')).toBe(true);
    // Duas animações: o trajeto no invólucro e o giro na carta.
    expect(flights).toBe(2);

    const flier = document.body.querySelector<HTMLElement>('.card-flight');
    const clone = flier?.querySelector<HTMLElement>('.hero__card');

    expect(flier?.style.position).toBe('fixed');
    expect(clone).toBeTruthy();
    // O clone carrega a classe do herói, e com ela a animação de entrada dele.
    // Se ela não for calada, disputa 'transform' com o voo e a carta não sai
    // do lugar: foi exatamente esse conflito que matou a animação.
    expect(clone!.style.animation).toBe('none');
    expect(clone!.style.transition).toBe('none');
  });

  it('mostra o cabeçalho mesmo se o arremesso não puder acontecer', async () => {
    const fixture = await mount();

    // Sem medidas utilizáveis, o voo é pulado. O cabeçalho não pode ir junto.
    Element.prototype.getBoundingClientRect = () => ({ width: 0, height: 0 }) as DOMRect;
    notify([{ boundingClientRect: { top: -60 }, intersectionRatio: 0.4 }]);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('app-floating-header') as HTMLElement;

    expect(header.classList.contains('is-pinned')).toBe(true);
  });
});
