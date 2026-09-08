/**
 * Vibração do aparelho, quando existir.
 *
 * O iPhone não expõe essa API, e alguns navegadores a bloqueiam fora de um
 * gesto do usuário. Nos dois casos a falha é silenciosa: a vibração é um
 * tempero, nunca a única pista do que está acontecendo na tela.
 */
export function vibrate(pattern: number | readonly number[]): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

  try {
    navigator.vibrate(pattern as number | number[]);
  } catch {
    /* sem vibração, seguimos com o visual */
  }
}
