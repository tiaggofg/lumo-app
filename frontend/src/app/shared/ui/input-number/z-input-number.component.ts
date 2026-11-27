import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'z-input-number',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZInputNumberComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="relative flex items-center w-full"
      [class]="styleClass()"
    >
      @if (mode() === 'currency') {
        <span
          class="absolute left-3.5 text-sm font-semibold text-slate-400 dark:text-slate-500 pointer-events-none select-none"
        >
          R$
        </span>
      }
      <input
        type="text"
        inputmode="decimal"
        [id]="inputId() || null"
        [disabled]="disabled()"
        [placeholder]="placeholder()"
        [value]="displayValue()"
        (input)="onRawInput($event)"
        (blur)="onBlur()"
        [class]="
          'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 py-2.5 pr-3.5 text-[15px] font-mono tabular-nums text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all disabled:opacity-50 ' +
          (mode() === 'currency' ? 'pl-10' : 'pl-3.5')
        "
      />
    </div>
  `,
})
export class ZInputNumberComponent implements ControlValueAccessor {
  readonly inputId = input<string>('');
  readonly mode = input<'decimal' | 'currency'>('decimal');
  readonly currency = input<string>('BRL');
  readonly locale = input<string>('pt-BR');
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly useGrouping = input<boolean>(true);
  readonly placeholder = input<string>('');
  readonly styleClass = input<string>('');

  readonly displayValue = signal<string>('');
  readonly disabled = signal<boolean>(false);

  private currentValue: number | null = null;
  private onChange: (val: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | null | undefined): void {
    if (value === null || value === undefined || Number.isNaN(value)) {
      this.currentValue = null;
      this.displayValue.set('');
      return;
    }
    this.currentValue = value;
    this.displayValue.set(this.formatNumber(value));
  }

  registerOnChange(fn: (val: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onRawInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const raw = inputEl.value;
    this.displayValue.set(raw);

    const parsed = this.parseRawValue(raw);
    if (parsed === null) {
      this.currentValue = null;
      this.onChange(null);
      return;
    }

    const clamped = this.clampValue(parsed);
    this.currentValue = clamped;
    this.onChange(clamped);
  }

  onBlur(): void {
    this.onTouched();
    if (this.currentValue !== null) {
      this.displayValue.set(this.formatNumber(this.currentValue));
    }
  }

  parseRawValue(raw: string): number | null {
    const cleaned = raw.replace(/[R$\s]/g, '').trim();
    if (!cleaned) return null;

    let normalized = cleaned;
    if (cleaned.includes(',') && cleaned.includes('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      normalized = cleaned.replace(',', '.');
    }

    const num = Number(normalized);
    if (!Number.isFinite(num)) return null;
    return num;
  }

  private clampValue(value: number): number {
    let result = value;
    const minVal = this.min();
    const maxVal = this.max();
    if (minVal !== null && result < minVal) {
      result = minVal;
    }
    if (maxVal !== null && result > maxVal) {
      result = maxVal;
    }
    return result;
  }

  private formatNumber(value: number): string {
    if (this.mode() === 'currency') {
      return value.toFixed(2).replace('.', ',');
    }
    return String(value);
  }
}
