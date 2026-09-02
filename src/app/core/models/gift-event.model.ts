/** Cor dominante de um presente, mapeada para as variáveis de tema. */
export type GiftAccent = 'magenta' | 'violet' | 'gold';

/**
 * Um presente/evento da contagem.
 *
 * `opensAt` usa o formato local `AAAA-MM-DDTHH:mm` (o mesmo do
 * `<input type="datetime-local">`), então o horário é sempre o do dispositivo
 * dela, sem surpresas de fuso.
 */
export interface GiftEvent {
  readonly id: string;
  /** Título exibido no card e no cabeçalho da revelação. */
  readonly title: string;
  /** Provocação visível enquanto o presente ainda está selado. */
  readonly teaser: string;
  /** Conteúdo revelado quando o presente abre. Quebras de linha viram parágrafos. */
  readonly message: string;
  /** Emoji/símbolo estampado na carta. */
  readonly icon: string;
  readonly accent: GiftAccent;
  /** Instante em que o presente destrava, no formato `AAAA-MM-DDTHH:mm`. */
  readonly opensAt: string;
  /** Por quantos minutos ele fica em destaque antes de virar lembrança. */
  readonly durationMinutes: number;
}

/**
 * Estágio de um presente na linha do tempo:
 * - `sealed`: ainda não chegou a hora;
 * - `live`: dentro da janela de abertura, em destaque;
 * - `memory`: a janela passou; continua acessível, mas fora dos holofotes.
 */
export type GiftEventPhase = 'sealed' | 'live' | 'memory';

/** Presente + estado derivado do relógio. É isto que a interface consome. */
export interface GiftEventView {
  readonly event: GiftEvent;
  readonly phase: GiftEventPhase;
  /** Timestamps resolvidos, para não reparsear datas no template. */
  readonly opensAtMs: number;
  readonly closesAtMs: number;
  /** Quanto falta para destravar (0 quando já destravou). */
  readonly msUntilOpen: number;
  /** Quanto ainda resta da janela de destaque (0 fora dela). */
  readonly msRemaining: number;
  /** Progresso dentro da janela de destaque, de 0 a 1. */
  readonly windowProgress: number;
  /** `true` depois que ela abriu a carta ao menos uma vez. */
  readonly opened: boolean;
}
