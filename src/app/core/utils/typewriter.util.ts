/**
 * O ritmo de quem digita de verdade: a mão hesita um pouco a cada tecla, para
 * na vírgula e respira no ponto final. Sem sorteio: a hesitação vem do índice
 * do caractere, então o mesmo texto sai sempre com o mesmo compasso, e um
 * teste consegue acompanhar tecla por tecla.
 */

const KEY_MS = 26;
/** Cinco tamanhos de hesitação, um por tecla, em ciclo desalinhado. */
const HESITATION_STEP_MS = 6;
const HESITATION_STEPS = 5;
const COMMA_PAUSE_MS = 180;
const SENTENCE_PAUSE_MS = 420;

/** Quanto esperar depois de digitar o caractere `index` de `text`. */
export function keystrokeDelay(text: string, index: number): number {
  const char = text[index];
  const hesitation = ((index * 7) % HESITATION_STEPS) * HESITATION_STEP_MS;

  if (char === ',' || char === ';' || char === ':') return COMMA_PAUSE_MS;
  if (char === '.' || char === '!' || char === '?') return SENTENCE_PAUSE_MS;

  return KEY_MS + hesitation;
}

/** Quanto leva para digitar `text` inteiro, do primeiro caractere ao último. */
export function typingDuration(text: string): number {
  let total = 0;
  for (let index = 0; index < text.length; index++) total += keystrokeDelay(text, index);

  return total;
}
