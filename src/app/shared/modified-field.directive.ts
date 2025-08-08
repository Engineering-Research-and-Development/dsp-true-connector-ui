import { Directive, HostBinding, Input } from '@angular/core';
import { EditStateService } from './edit-state.service';

@Directive({ selector: '[tcModified]', standalone: true })
export class ModifiedFieldDirective {
  @Input('tcModified') config!: { key: string; state: EditStateService };

  @HostBinding('class.field-modified')
  get isModified(): boolean {
    return this.config?.state?.isChanged(this.config.key) ?? false;
  }
}
