import { vi } from 'vitest';

/**
 * Um contexto 2D de mentira para o jsdom, que não desenha nada: registra as
 * chamadas e devolve o bitmap que o teste mandar em `getImageData`.
 */
export interface FakeContext2D {
  readonly calls: string[];
  globalCompositeOperation: string;
  /** O que `getImageData` devolve: mude para simular quanto já foi raspado. */
  alpha: number;
}

export function installFakeCanvas(): FakeContext2D {
  const fake: FakeContext2D = { calls: [], globalCompositeOperation: 'source-over', alpha: 255 };

  const record = (name: string) => () => {
    fake.calls.push(name);
    return undefined;
  };
  const gradient = () => ({ addColorStop: () => undefined });

  const context = {
    get globalCompositeOperation() {
      return fake.globalCompositeOperation;
    },
    set globalCompositeOperation(value: string) {
      fake.globalCompositeOperation = value;
    },
    createLinearGradient: gradient,
    createRadialGradient: gradient,
    fillRect: record('fillRect'),
    clearRect: record('clearRect'),
    beginPath: record('beginPath'),
    arc: record('arc'),
    fill: record('fill'),
    fillText: record('fillText'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    stroke: record('stroke'),
    drawImage: record('drawImage'),
    getImageData: (_x: number, _y: number, w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 3; i < data.length; i += 4) data[i] = fake.alpha;
      return { data, width: w, height: h };
    },
  };

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => context as unknown as CanvasRenderingContext2D,
  );

  return fake;
}
