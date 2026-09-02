import { Pipe, PipeTransform } from '@angular/core';
import { formatFullDateTime, formatShortDateTime } from '../../core/utils/time.util';

/** `{{ timestamp | schedule }}` -> "15/09 · 00:00"; `| schedule:'long'` por extenso. */
@Pipe({ name: 'schedule' })
export class SchedulePipe implements PipeTransform {
  transform(timestamp: number, format: 'short' | 'long' = 'short'): string {
    return format === 'long' ? formatFullDateTime(timestamp) : formatShortDateTime(timestamp);
  }
}
