import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FakeContext2D, installFakeCanvas } from '../../../../testing/fake-canvas';
import { ScratchFoil } from './scratch-foil';

describe('ScratchFoil', () => {
  let fixture: ComponentFixture<ScratchFoil>;
  let host: HTMLElement;
  let canvas: FakeContext2D;
  let revealed: () => void;

  beforeEach(async () => {
    canvas = installFakeCanvas();

    await TestBed.configureTestingModule({ imports: [ScratchFoil] }).compileComponents();

    fixture = TestBed.createComponent(ScratchFoil);
    host = fixture.nativeElement as HTMLElement;
    host.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 }) as DOMRect;
    revealed = vi.fn<() => void>();
    fixture.componentInstance.revealed.subscribe(revealed);
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  function pointer(type: string, x: number, y: number): void {
    host.dispatchEvent(
      new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }) as unknown as PointerEvent,
    );
    fixture.detectChanges();
  }

  /** Um traço com `moves` movimentos do dedo. */
  function scratch(moves: number): void {
    pointer('pointerdown', 10, 10);
    for (let step = 1; step <= moves; step++) pointer('pointermove', 10 + step * 10, 10);
    pointer('pointerup', 10 + moves * 10, 10);
  }

  it('pinta o foil e o convite para raspar', () => {
    expect(canvas.calls).toContain('fillRect');
    expect(canvas.calls).toContain('fillText');
    expect(host.classList.contains('is-revealed')).toBe(false);
    expect(revealed).not.toHaveBeenCalled();
  });

  it('apaga por onde o dedo passa, e só enquanto ele está apoiado', () => {
    canvas.calls.length = 0;

    pointer('pointermove', 50, 50);
    expect(canvas.calls).not.toContain('stroke');

    pointer('pointerdown', 50, 50);
    pointer('pointermove', 80, 60);
    expect(canvas.globalCompositeOperation).toBe('destination-out');
    expect(canvas.calls.filter((call) => call === 'stroke').length).toBe(2);
  });

  it('solta fagulhas no rastro do dedo', () => {
    pointer('pointerdown', 50, 50);

    expect(host.querySelectorAll('.spark').length).toBe(1);
  });

  it('fica coberto enquanto ela raspou pouco', () => {
    canvas.alpha = 255;
    scratch(8);

    expect(host.classList.contains('is-revealed')).toBe(false);
    expect(revealed).not.toHaveBeenCalled();
  });

  it('se dissolve sozinho quando ela raspou o bastante', () => {
    canvas.alpha = 0;
    scratch(8);

    expect(host.classList.contains('is-revealed')).toBe(true);
    expect(revealed).toHaveBeenCalledTimes(1);

    // Raspar mais depois de revelado não faz nada.
    scratch(3);
    expect(revealed).toHaveBeenCalledTimes(1);
  });

  it('revela na hora pelo botão do teclado', () => {
    (host.querySelector('.foil__skip') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.classList.contains('is-revealed')).toBe(true);
    expect(revealed).toHaveBeenCalledTimes(1);
  });
});

describe('ScratchFoil: sem canvas', () => {
  it('não esconde a foto de quem não consegue raspar', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
    await TestBed.configureTestingModule({ imports: [ScratchFoil] }).compileComponents();

    const fixture = TestBed.createComponent(ScratchFoil);
    const revealed = vi.fn<() => void>();
    fixture.componentInstance.revealed.subscribe(revealed);
    fixture.detectChanges();

    expect(revealed).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });
});
