import { clearedRatio } from './scratch.util';

/** Um bitmap de `count` pixels com o alfa dado em cada um. */
function pixels(alphas: readonly number[]): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(alphas.length * 4);
  alphas.forEach((alpha, index) => (rgba[index * 4 + 3] = alpha));

  return rgba;
}

describe('clearedRatio', () => {
  it('é zero com o foil inteiro e um com tudo raspado', () => {
    expect(clearedRatio(pixels([255, 255, 255, 255]))).toBe(0);
    expect(clearedRatio(pixels([0, 0, 0, 0]))).toBe(1);
  });

  it('conta só o que ficou transparente de verdade', () => {
    // Meio apagado ainda é foil; quase apagado já mostra a foto.
    expect(clearedRatio(pixels([255, 200, 127, 0]))).toBe(0.5);
  });

  it('não divide por zero num bitmap vazio', () => {
    expect(clearedRatio(new Uint8ClampedArray(0))).toBe(0);
  });
});
