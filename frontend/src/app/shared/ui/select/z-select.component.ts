import {
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'z-select',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full" [class]="styleClass()">
      <div class="relative flex items-center w-full">
        <button
          type="button"
          [id]="inputId() || null"
          [disabled]="disabled()"
          (click)="toggleOpen()"
          [attr.aria-expanded]="open()"
          aria-haspopup="listbox"
          class="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 px-3.5 py-2.5 text-[15px] text-left text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all cursor-pointer disabled:opacity-50"
          data-testid="z-select-trigger"
        >
          <span
            class="truncate"
            [class.text-slate-400]="!hasSelection()"
            [class.dark:text-slate-500]="!hasSelection()"
          >
            {{ selectedLabel() || placeholder() }}
          </span>

          <span class="flex items-center gap-1 shrink-0">
            <svg
              class="w-4 h-4 text-slate-400 transition-transform duration-150"
              [class.rotate-180]="open()"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M5.5 7.5L10 12L14.5 7.5"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </button>

        @if (showClear() && hasSelection() && !disabled()) {
          <button
            type="button"
            (click)="clearValue($event)"
            class="absolute right-8 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Limpar seleção"
            data-testid="z-select-clear"
          >
            <i class="pi pi-times text-[11px]" aria-hidden="true"></i>
          </button>
        }
      </div>

      @if (open()) {
        <ul
          role="listbox"
          data-testid="z-select-listbox"
          class="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl space-y-0.5"
        >
          @for (opt of options(); track $index) {
            <li
              role="option"
              [attr.aria-selected]="isOptionSelected(opt)"
              (click)="selectOption(opt)"
              [class]="
                isOptionSelected(opt)
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              "
              class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors"
            >
              <span class="truncate">{{ getOptionLabel(opt) }}</span>
              @if (isOptionSelected(opt)) {
                <i class="pi pi-check text-xs text-indigo-600 dark:text-indigo-400" aria-hidden="true"></i>
              }
            </li>
          } @empty {
            <li class="px-3 py-2 text-xs text-slate-400 text-center">
              Nenhuma opção disponível
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class ZSelectComponent implements ControlValueAccessor {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly inputId = input<string>('');
  readonly options = input<readonly unknown[]>([]);
  readonly optionLabel = input<string>('label');
  readonly optionValue = input<string>('value');
  readonly placeholder = input<string>('Selecione');
  readonly showClear = input<boolean>(false);
  readonly styleClass = input<string>('');

  readonly open = signal<boolean>(false);
  readonly disabled = signal<boolean>(false);
  readonly currentValue = signal<unknown>(null);

  private onChange: (val: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly hasSelection = computed(() => {
    const val = this.currentValue();
    return val !== null && val !== undefined && val !== '';
  });

  readonly selectedLabel = computed(() => {
    const val = this.currentValue();
    if (val === null || val === undefined || val === '') return '';
    const matched = this.options().find((opt) => this.getOptionValue(opt) === val);
    return matched ? this.getOptionLabel(matched) : '';
  });

  writeValue(value: unknown): void {
    this.currentValue.set(value ?? null);
  }

  registerOnChange(fn: (val: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggleOpen(): void {
    if (this.disabled()) return;
    this.open.update((v) => !v);
    if (!this.open()) {
      this.onTouched();
    }
  }

  selectOption(option: unknown): void {
    const val = this.getOptionValue(option);
    this.currentValue.set(val);
    this.onChange(val);
    this.onTouched();
    this.open.set(false);
  }

  clearValue(event: MouseEvent): void {
    event.stopPropagation();
    this.currentValue.set(null);
    this.onChange(null);
    this.onTouched();
    this.open.set(false);
  }

  isOptionSelected(option: unknown): boolean {
    return this.getOptionValue(option) === this.currentValue();
  }

  getOptionLabel(option: unknown): string {
    if (option && typeof option === 'object') {
      const record = option as Record<string, unknown>;
      return String(record[this.optionLabel()] ?? '');
    }
    return String(option ?? '');
  }

  getOptionValue(option: unknown): unknown {
    if (option && typeof option === 'object') {
      const record = option as Record<string, unknown>;
      const key = this.optionValue();
      return key in record ? record[key] : option;
    }
    return option;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.open.set(false);
      this.onTouched();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.open.set(false);
      this.onTouched();
    }
  }
}
