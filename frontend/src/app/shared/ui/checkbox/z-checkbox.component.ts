import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'z-checkbox',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZCheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <span class="inline-flex items-center">
      <input
        type="checkbox"
        [id]="inputId() || null"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onInputChange($event)"
        class="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 accent-indigo-600 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer disabled:opacity-50"
      />
    </span>
  `,
})
export class ZCheckboxComponent implements ControlValueAccessor {
  readonly inputId = input<string>('');
  readonly binary = input<boolean>(true);

  readonly checked = signal<boolean>(false);
  readonly disabled = signal<boolean>(false);

  private onChange: (val: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: boolean | null | undefined): void {
    this.checked.set(Boolean(value));
  }

  registerOnChange(fn: (val: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInputChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const next = inputEl.checked;
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }
}
