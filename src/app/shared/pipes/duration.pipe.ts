import { Pipe, PipeTransform } from '@angular/core';
import { humanizeDuration } from '../../core/utils/time.util';

/** `{{ ms | duration }}` -> "3d 04h", "4h 12min", "38s". */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(milliseconds: number): string {
    return humanizeDuration(milliseconds);
  }
}
