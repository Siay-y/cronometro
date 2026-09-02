import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Acesso ao `localStorage` tolerante a SSR e a navegações em modo privativo:
 * qualquer falha degrada para o valor padrão em vez de quebrar a página.
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  read<T>(key: string, fallback: T): T {
    if (!this.isBrowser) return fallback;

    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  write(key: string, value: unknown): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Cota estourada ou storage bloqueado: seguimos só com o estado em memória. */
    }
  }

  remove(key: string): void {
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(key);
    } catch {
      /* idem */
    }
  }
}
