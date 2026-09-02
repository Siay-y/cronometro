import { InjectionToken } from '@angular/core';

/**
 * Tudo que é "sobre ela" mora aqui. Para adaptar o site, mexa só neste arquivo
 * (e em `gift-events.data.ts`, com a lista de presentes).
 */
export interface CelebrationConfig {
  /** Como ela é chamada em toda a interface. */
  readonly honorific: string;
  /** Assinatura ao pé das cartas. */
  readonly signature: string;
  /** Bordão de abertura. */
  readonly tagline: string;
  /** Data e hora exatas do aniversário (horário local). */
  readonly birthdayAt: string;
  /** Início da jornada: ancora a barra de progresso da contagem. */
  readonly journeyStartsAt: string;
  /** A carta final, aberta quando o contador zera. */
  readonly birthdayLetter: readonly string[];
}

export const CELEBRATION: CelebrationConfig = {
  honorific: 'Mon Cher',
  signature: 'Com todo o meu amor',
  tagline: 'Laissez les bons temps rouler',
  birthdayAt: '2026-09-15T00:00',
  journeyStartsAt: '2026-09-01T00:00',
  birthdayLetter: [
    'Chegou o dia, Mon Cher.',
    'Passei este mês inteiro carregando cada carta com um pedacinho do que eu sinto por você, e hoje todas elas explodem de uma vez.',
    'Que este ano te traga tudo aquilo que você ainda nem sabe que quer. E que eu possa estar por perto pra ver cada uma dessas coisas acontecendo.',
    'Feliz aniversário. Você é a melhor carta que a vida já me deu.',
  ],
};

/**
 * Token de injeção: deixa a configuração trocável (útil em testes) sem que
 * nenhum serviço precise importar a constante diretamente.
 */
export const CELEBRATION_CONFIG = new InjectionToken<CelebrationConfig>('CELEBRATION_CONFIG', {
  providedIn: 'root',
  factory: () => CELEBRATION,
});
