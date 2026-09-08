import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FloatingHeader } from './floating-header';

type Entry = Pick<IntersectionObserverEntry, 'intersectionRatio'> & {
  boundingClientRect: { top: number };
};

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height, right: left + width, bottom: top + height } as DOMRect;
}

describe('FloatingHeader', () => {
  let fixture: ComponentFixture<FloatingHeader>;
  let host: HTMLElement;
  let notify: (entries: Entry[]) => void;
  let disconnected: boolean;
  /** Animações criadas, para resolvê-las à mão e conferir o pouso. */
  let animations: { keyframes: { transform: string }[]; resolve: () => void }[];

  beforeEach(async () => {
    disconnected = false;
    animations = [];

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: Entry[]) => void) {
          notify = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {
          disconnected = true;
        }
      },
    );

    // jsdom não traz a Web Animations API: fingimos o voo e guardamos o gatilho.
    Element.prototype.animate = function (keyframes: unknown) {
      let resolve!: () => void;
      const finished = new Promise<void>((r) => (resolve = r));
      animations.push({ keyframes: keyframes as { transform: string }[], resolve });

      return { finished, cancel: () => undefined } as unknown as Animation;
    };

    await TestBed.configureTestingModule({ imports: [FloatingHeader] }).compileComponents();

    fixture = TestBed.createComponent(FloatingHeader);
    fixture.componentRef.setInput('sentinel', document.createElement('span'));
    fixture.detectChanges();
    await fixture.whenStable();

    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.querySelectorAll('.card-flight').forEach((node) => node.remove());
  });

  function observe(top: number, intersectionRatio: number): void {
    notify([{ boundingClientRect: { top }, intersectionRatio } as Entry]);
    fixture.detectChanges();
  }

  function fliers(): number {
    return document.body.querySelectorAll('.card-flight').length;
  }

  function landingCard(): HTMLElement {
    return host.querySelector('app-playing-card') as HTMLElement;
  }

  function sized(element: HTMLElement, layout: [number, number], box: DOMRect): void {
    element.getBoundingClientRect = () => box;
    Object.defineProperty(element, 'offsetWidth', { value: layout[0], configurable: true });
    Object.defineProperty(element, 'offsetHeight', { value: layout[1], configurable: true });
  }

  /**
   * Cartas de mentira com as duas medidas separadas: o tamanho de layout e o
   * retângulo delimitador, que é maior porque as cartas ficam inclinadas.
   */
  function giveOrigin(): HTMLElement {
    const origin = document.createElement('div');
    origin.className = 'hero-card';
    sized(origin, [110, 154], rect(40, -20, 128, 168));
    sized(landingCard(), [27, 38], rect(16, 8, 32, 44));

    fixture.componentRef.setInput('origin', origin);
    fixture.detectChanges();

    return origin;
  }

  it('começa recolhido, com o contador ainda na tela', () => {
    expect(host.classList.contains('is-pinned')).toBe(false);
    expect(host.textContent).toContain('Gambit fez isso só para você');
    expect(host.textContent).toContain('mon amour');
  });

  it('aparece quando a carta some sob a borda de cima', () => {
    observe(-120, 0.4);

    expect(host.classList.contains('is-pinned')).toBe(true);
  });

  it('dispara mesmo quando o navegador reporta a razão em cima do limiar', () => {
    // O navegador entrega o valor exato do threshold declarado. Se o limite de
    // decisão fosse o mesmo número, o empate travaria o gatilho para sempre.
    observe(-60, 0.4);

    expect(host.classList.contains('is-pinned')).toBe(true);
  });

  it('fica quieto quando o alvo ainda está abaixo da tela', () => {
    // Mesma fração visível do caso acima, mas ela nem rolou ainda.
    observe(900, 0.4);

    expect(host.classList.contains('is-pinned')).toBe(false);
  });

  it('só recolhe quando a carta reaparece quase inteira', () => {
    observe(-120, 0.4);

    // Zona morta entre os dois limites: nada muda, e o cabeçalho não pisca.
    observe(-40, 0.7);
    expect(host.classList.contains('is-pinned')).toBe(true);

    observe(10, 0.99);
    expect(host.classList.contains('is-pinned')).toBe(false);
  });

  it('deixa uma carta só na tela durante o voo', () => {
    const origin = giveOrigin();

    observe(-120, 0.4);

    expect(fliers()).toBe(1);
    // A original some e a do cabeçalho ainda não chegou: nada de carta dupla.
    expect(origin.style.visibility).toBe('hidden');
    expect(landingCard().style.opacity).toBe('0');
  });

  it('devolve as duas cartas ao normal quando o voo termina', async () => {
    const origin = giveOrigin();

    observe(-120, 0.4);
    animations[0].resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(fliers()).toBe(0);
    expect(origin.style.visibility).toBe('');
    expect(landingCard().style.opacity).toBe('');
  });

  it('separa o trajeto do giro, cada um com a sua curva de tempo', () => {
    giveOrigin();
    observe(-120, 0.4);

    const [travel, spin] = animations;

    // O trajeto encolhe e desloca, mas não gira.
    expect(travel.keyframes.at(-1)!.transform).toContain('scale(');
    expect(travel.keyframes.at(-1)!.transform).not.toContain('rotate');
    // -368° = uma volta mais os 8° de repouso da carta do cabeçalho.
    expect(spin.keyframes.at(-1)!.transform).toContain('rotate(-368deg)');
  });

  it('mede as cartas pelo tamanho de layout, e não pelo retângulo inclinado', () => {
    const origin = giveOrigin();
    observe(-120, 0.4);

    const flier = document.body.querySelector<HTMLElement>('.card-flight')!;

    // 27/110, e não 32/128: o retângulo de um elemento girado é maior que ele,
    // e usá-lo fazia o clone voar mais gordo que a carta que ele substitui.
    expect(animations[0].keyframes.at(-1)!.transform).toContain('scale(0.2454');
    expect(flier.style.width).toBe('110px');
    expect(flier.style.height).toBe('154px');
    // Centrado sobre a carta original: 40 + 128/2 - 110/2.
    expect(flier.style.left).toBe('49px');
    expect(origin.style.visibility).toBe('hidden');
  });

  it('devolve a carta ao contador se ela voltar ao topo no meio do voo', () => {
    const origin = giveOrigin();
    observe(-120, 0.4);

    observe(10, 0.99);

    expect(origin.style.visibility).toBe('');
    expect(fliers()).toBe(0);
  });

  it('mantém um voo só quando ela sobe e desce depressa', () => {
    giveOrigin();

    observe(-120, 0.4);
    observe(10, 0.99);
    observe(-120, 0.4);
    observe(10, 0.99);
    observe(-120, 0.4);

    expect(fliers()).toBe(1);
  });

  it('não tenta arremessar nada quando não há carta de herói', () => {
    observe(-120, 0.4);

    expect(animations.length).toBe(0);
    expect(host.classList.contains('is-pinned')).toBe(true);
  });

  it('desliga o observador quando sai da tela', () => {
    fixture.destroy();

    expect(disconnected).toBe(true);
  });
});
