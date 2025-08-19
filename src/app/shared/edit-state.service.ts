import { Injectable, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EditStateService implements OnDestroy {
  private form?: FormGroup;
  private originalSnapshot?: any;
  private sub?: Subscription;
  private changed = false;

  init(form: FormGroup): void {
    this.form = form;
    this.originalSnapshot = this.deepClone(form.getRawValue());
    this.changed = false;
    this.sub?.unsubscribe();
    this.sub = form.valueChanges.subscribe(() => this.evaluateChanges());
  }

  hasChanges(): boolean {
    return this.changed;
  }

  isChanged(path: string): boolean {
    if (!this.form || !this.originalSnapshot) return false;
    const current = this.getByPath(this.form.getRawValue(), path);
    const prev = this.getByPath(this.originalSnapshot, path);
    return !this.valuesEqual(current, prev);
  }

  oldValue(path: string): string {
    if (!this.originalSnapshot) return 'N/A';
    const value = this.getByPath(this.originalSnapshot, path);
    return this.format(value);
  }

  destroy(): void {
    this.sub?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private evaluateChanges(): void {
    if (!this.form || !this.originalSnapshot) return;
    this.changed = !this.valuesEqual(
      this.originalSnapshot,
      this.form.getRawValue()
    );
  }

  private deepClone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v));
  }

  private valuesEqual(a: any, b: any): boolean {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  }

  private getByPath(obj: any, path: string): any {
    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  private format(value: any): string {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }
}
