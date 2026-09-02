import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { pad2 } from '../../../core/utils/time.util';

/**
 * Uma casa da contagem (dias, horas, minutos ou segundos).
 *
 * Cada dígito vive em um `@for` com `track` pelo próprio caractere: quando o
 * número muda, o Angular troca o nó e dispara as animações nativas
 * `animate.enter` / `animate.leave`: o dígito antigo cai e o novo desce,
 * sem nenhuma biblioteca de animação.
 */
@Component({
  selector: 'app-time-unit',
  templateUrl: './time-unit.html',
  styleUrl: './time-unit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeUnit {
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  /** Destaca a casa dos segundos com um brilho mais vivo. */
  readonly pulsing = input(false, { transform: booleanAttribute });

  protected readonly digits = computed(() => pad2(this.value()).split(''));
}
