import { Pipe, PipeTransform } from '@angular/core';
import { EditStateService } from './edit-state.service';

@Pipe({ name: 'oldValue', standalone: true })
export class OldValuePipe implements PipeTransform {
  transform(path: string, state: EditStateService): string {
    return state.oldValue(path);
  }
}
