import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: false
})
export class TruncatePipe implements PipeTransform {

  transform(value: string, limit: number = 20): string {
    if (!value) return '';
    if (value.length <= limit) return value;
    return value.slice(0, limit) + '...';
  }

}
