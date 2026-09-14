import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { installFakeCanvas } from '../../../../testing/fake-canvas';
import { PhotoViewer } from '../photo-viewer/photo-viewer';
import { ScratchFoil } from '../scratch-foil/scratch-foil';
import { PhotoFrame } from './photo-frame';

describe('PhotoFrame', () => {
  let fixture: ComponentFixture<PhotoFrame>;
  let host: HTMLElement;
  let open: ReturnType<typeof vi.spyOn>;

  async function mount(foil: boolean): Promise<void> {
    await TestBed.configureTestingModule({ imports: [PhotoFrame] }).compileComponents();

    fixture = TestBed.createComponent(PhotoFrame);
    fixture.componentRef.setInput('photo', {
      src: '/fotos/a.jpg',
      alt: 'A',
      caption: 'legenda',
      foil,
    });
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;

    const viewer = fixture.debugElement.query(By.directive(PhotoViewer))
      .componentInstance as PhotoViewer;
    // O jsdom não tem `showModal`: o visor de verdade fica de fora.
    open = vi.spyOn(viewer, 'open').mockImplementation(() => undefined);
  }

  beforeEach(() => installFakeCanvas());
  afterEach(() => vi.restoreAllMocks());

  it('mostra a foto com a legenda e abre o visor ao toque', async () => {
    await mount(false);

    expect(host.querySelector('img')?.getAttribute('src')).toBe('/fotos/a.jpg');
    expect(host.textContent).toContain('legenda');
    expect(host.textContent).toContain('toque para ver de perto');
    expect(host.querySelector('app-scratch-foil')).toBeNull();

    (host.querySelector('.frame') as HTMLButtonElement).click();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('cobre a foto com a raspadinha e não abre o visor enquanto ela não raspar', async () => {
    await mount(true);

    expect(host.querySelector('.frame__wrap')?.classList.contains('is-foiled')).toBe(true);
    expect(host.querySelector('app-scratch-foil')).toBeTruthy();
    expect(host.textContent).toContain('raspe com o dedo');

    (host.querySelector('.frame') as HTMLButtonElement).click();
    expect(open).not.toHaveBeenCalled();
  });

  it('libera a moldura assim que a foto é revelada', async () => {
    await mount(true);

    const foil = fixture.debugElement.query(By.directive(ScratchFoil))
      .componentInstance as ScratchFoil;
    foil.revealed.emit();
    fixture.detectChanges();

    expect(host.querySelector('.frame__wrap')?.classList.contains('is-foiled')).toBe(false);
    expect(host.textContent).toContain('toque para ver de perto');

    (host.querySelector('.frame') as HTMLButtonElement).click();
    expect(open).toHaveBeenCalledTimes(1);
  });
});
