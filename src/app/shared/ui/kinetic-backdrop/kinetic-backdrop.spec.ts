import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KineticBackdrop } from './kinetic-backdrop';

/** Espera alguns quadros para o loop de animação alcançar o ponteiro. */
function nextFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const step = () => (remaining-- > 0 ? requestAnimationFrame(step) : resolve());
    step();
  });
}

describe('KineticBackdrop', () => {
  let fixture: ComponentFixture<KineticBackdrop>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KineticBackdrop] }).compileComponents();
    fixture = TestBed.createComponent(KineticBackdrop);
    fixture.detectChanges();
    await fixture.whenStable();
    host = fixture.nativeElement as HTMLElement;
  });

  it('desenha o mesmo cenário no servidor e no navegador (semente fixa)', () => {
    const suits = [...host.querySelectorAll('.drift')].map((node) => node.textContent);

    expect(suits.length).toBe(16);
    // Se esta sequência mudar, a hidratação passa a reposicionar as cartas.
    expect(suits.join('')).toBe('♥♥♠♣♥♦♥♦♦♦♦♣♣♠♥♦');
  });

  it('só acende o halo depois que o ponteiro se move', async () => {
    expect(host.classList.contains('has-pointer')).toBe(false);

    window.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 320, clientY: 180 }) as unknown as PointerEvent,
    );
    await nextFrames(3);

    expect(host.classList.contains('has-pointer')).toBe(true);
    expect(host.style.getPropertyValue('--pointer-x')).not.toBe('');
    expect(host.style.getPropertyValue('--tilt-x')).not.toBe('');
  });

  it('dispara a carta de energia no clique', () => {
    const burst = host.querySelector('.burst') as HTMLElement;

    expect(burst.classList.contains('is-firing')).toBe(false);

    window.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 90, clientY: 240 }) as unknown as PointerEvent,
    );

    expect(burst.classList.contains('is-firing')).toBe(true);
    expect(burst.style.getPropertyValue('--burst-x')).toBe('90px');
  });
});
