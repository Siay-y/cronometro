/** Abaixo disto o pixel do foil conta como raspado. */
const CLEARED_ALPHA = 128;

/**
 * Fração de pixels já raspados num bitmap RGBA (o `data` de um `ImageData`):
 * 0 com o foil inteiro, 1 com tudo à mostra.
 */
export function clearedRatio(rgba: Uint8ClampedArray): number {
  const pixels = rgba.length / 4;
  if (pixels === 0) return 0;

  let cleared = 0;
  for (let alpha = 3; alpha < rgba.length; alpha += 4) {
    if (rgba[alpha] < CLEARED_ALPHA) cleared++;
  }

  return cleared / pixels;
}
