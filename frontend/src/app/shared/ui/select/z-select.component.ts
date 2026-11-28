import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ZSelectPanelPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'bottom' | 'top';
}

const PANEL_GAP = 6;
const VIEWPORT_MARGIN = 8;
const LISTBOX_MAX_HEIGHT = 240;
const SEARCH_HEADER_HEIGHT = 50;
const ITEM_ROW_HEIGHT = 36;
const PANEL_PADDING_Y = 14;
const MIN_PANEL_HEIGHT = 88;

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
          #triggerBtn
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
        <div
          #panelRef
          data-testid="z-select-panel"
          [attr.data-placement]="panelPosition().placement"
          [style.top.px]="panelPosition().top"
          [style.left.px]="panelPosition().left"
          [style.width.px]="panelPosition().width"
          [style.max-height.px]="panelPosition().maxHeight"
          (click)="$event.stopPropagation()"
          class="fixed z-[70] flex flex-col overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
        >
          @if (searchable()) {
            <div class="p-1.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div class="relative flex items-center">
                <i
                  class="pi pi-search text-xs text-slate-400 absolute left-2.5 pointer-events-none"
                  aria-hidden="true"
                ></i>
                <input
                  #searchInput
                  type="text"
                  data-testid="z-select-search"
                  [value]="searchQuery()"
                  (input)="onSearchInput($event)"
                  [placeholder]="searchPlaceholder()"
                  [attr.aria-label]="searchPlaceholder()"
                  autocomplete="off"
                  class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950/60 pl-8 pr-7 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                />
                @if (searchQuery()) {
                  <button
                    type="button"
                    (click)="clearSearch($event)"
                    class="absolute right-1.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label="Limpar busca"
                    data-testid="z-select-search-clear"
                  >
                    <i class="pi pi-times text-[10px]" aria-hidden="true"></i>
                  </button>
                }
              </div>
            </div>
          }

          <ul
            role="listbox"
            data-testid="z-select-listbox"
            class="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5"
          >
            @for (opt of filteredOptions(); track $index) {
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
              <li class="px-3 py-2 text-xs text-slate-400 text-center" data-testid="z-select-empty">
                {{ options().length === 0 ? 'Nenhuma opção disponível' : 'Nenhum resultado encontrado' }}
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class ZSelectComponent implements ControlValueAccessor, OnDestroy {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly inputId = input<string>('');
  readonly options = input<readonly unknown[]>([]);
  readonly optionLabel = input<string>('label');
  readonly optionValue = input<string>('value');
  readonly placeholder = input<string>('Selecione');
  readonly showClear = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly searchPlaceholder = input<string>('Buscar...');
  readonly styleClass = input<string>('');

  readonly open = signal<boolean>(false);
  readonly disabled = signal<boolean>(false);
  readonly currentValue = signal<unknown>(null);
  readonly searchQuery = signal<string>('');
  readonly panelPosition = signal<ZSelectPanelPosition>({
    top: VIEWPORT_MARGIN,
    left: VIEWPORT_MARGIN,
    width: 240,
    maxHeight: LISTBOX_MAX_HEIGHT,
    placement: 'bottom',
  });

  private readonly triggerBtn = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
  private readonly panelRef = viewChild<ElementRef<HTMLDivElement>>('panelRef');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  private listenersAttached = false;
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

  readonly filteredOptions = computed(() => {
    const opts = this.options();
    if (!this.searchable()) {
      return opts;
    }
    const query = this.normalizeText(this.searchQuery());
    if (!query) {
      return opts;
    }
    return opts.filter((opt) => this.normalizeText(this.getOptionLabel(opt)).includes(query));
  });

  private readonly handleExternalScroll = (event: Event): void => {
    if (!this.open()) return;
    const panelEl = this.panelRef()?.nativeElement;
    const target = event.target;
    if (panelEl && target instanceof Node && panelEl.contains(target)) {
      return;
    }

    const triggerEl = this.triggerBtn()?.nativeElement ?? this.hostRef.nativeElement;
    const rect = triggerEl.getBoundingClientRect();
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768;

    const outOfViewport =
      rect.bottom <= 0 || rect.top >= viewportH || rect.right <= 0 || rect.left >= viewportW;

    let outOfScrollContainer = false;
    if (
      target instanceof HTMLElement &&
      target !== document.documentElement &&
      target !== document.body &&
      target.contains(triggerEl)
    ) {
      const containerRect = target.getBoundingClientRect();
      if (containerRect.height > 0) {
        outOfScrollContainer =
          rect.bottom <= containerRect.top || rect.top >= containerRect.bottom;
      }
    }

    if (outOfViewport || outOfScrollContainer) {
      this.closePopover();
      return;
    }

    this.updatePanelPosition();
  };

  private readonly handleWindowResize = (): void => {
    if (!this.open()) return;
    this.updatePanelPosition();
  };

  private readonly handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this.open() || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.closePopover();
    this.cdr.detectChanges();
    this.triggerBtn()?.nativeElement.focus();
  };

  constructor() {
    effect(() => {
      if (!this.open()) return;
      this.filteredOptions();
      const searchEl = this.searchInput()?.nativeElement;
      if (this.searchable() && searchEl && document.activeElement !== searchEl) {
        searchEl.focus();
      }
      if (this.panelRef()) {
        this.updatePanelPosition();
      }
    });
  }

  ngOnDestroy(): void {
    this.detachGlobalListeners();
  }

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
    if (isDisabled && this.open()) {
      this.closePopover(false);
    }
  }

  toggleOpen(): void {
    if (this.disabled()) return;
    if (this.open()) {
      this.closePopover();
    } else {
      this.openPopover();
    }
  }

  openPopover(): void {
    if (this.disabled() || this.open()) return;
    this.searchQuery.set('');
    this.open.set(true);
    this.updatePanelPosition();
    this.attachGlobalListeners();
  }

  closePopover(markTouched = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.searchQuery.set('');
    this.detachGlobalListeners();
    if (markTouched) {
      this.onTouched();
    }
  }

  selectOption(option: unknown): void {
    const val = this.getOptionValue(option);
    this.currentValue.set(val);
    this.onChange(val);
    this.closePopover(true);
  }

  clearValue(event: MouseEvent): void {
    event.stopPropagation();
    this.currentValue.set(null);
    this.onChange(null);
    if (this.open()) {
      this.closePopover(true);
    } else {
      this.searchQuery.set('');
      this.onTouched();
    }
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchQuery.set(target?.value ?? '');
  }

  clearSearch(event: MouseEvent): void {
    event.stopPropagation();
    this.searchQuery.set('');
    this.searchInput()?.nativeElement.focus();
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

  updatePanelPosition(): void {
    const triggerEl = this.triggerBtn()?.nativeElement ?? this.hostRef.nativeElement;
    const rect = triggerEl.getBoundingClientRect();
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768;

    const maxWidth = Math.max(120, viewportW - VIEWPORT_MARGIN * 2);
    const width = rect.width > 0 ? Math.min(rect.width, maxWidth) : Math.min(240, maxWidth);
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, viewportW - width - VIEWPORT_MARGIN)
    );

    const searchHeight = this.searchable() ? SEARCH_HEADER_HEIGHT : 0;
    const maxAllowedTotal = LISTBOX_MAX_HEIGHT + searchHeight;
    const itemCount = Math.max(1, this.filteredOptions().length);
    const estimatedHeight = Math.min(
      maxAllowedTotal,
      itemCount * ITEM_ROW_HEIGHT + PANEL_PADDING_Y + searchHeight
    );

    const spaceBelow = Math.max(0, viewportH - rect.bottom - PANEL_GAP - VIEWPORT_MARGIN);
    const spaceAbove = Math.max(0, rect.top - PANEL_GAP - VIEWPORT_MARGIN);

    const openAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    const placement: 'bottom' | 'top' = openAbove ? 'top' : 'bottom';
    const availableSpace = openAbove ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(maxAllowedTotal, Math.max(MIN_PANEL_HEIGHT, availableSpace));

    const renderedEl = this.panelRef()?.nativeElement;
    const actualHeight =
      renderedEl && renderedEl.offsetHeight > 0
        ? Math.min(renderedEl.offsetHeight, maxHeight)
        : Math.min(estimatedHeight, maxHeight);

    const rawTop = openAbove ? rect.top - PANEL_GAP - actualHeight : rect.bottom + PANEL_GAP;
    const maxTop = Math.max(VIEWPORT_MARGIN, viewportH - VIEWPORT_MARGIN - actualHeight);
    const top = Math.max(VIEWPORT_MARGIN, Math.min(rawTop, maxTop));

    const next: ZSelectPanelPosition = {
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(width),
      maxHeight: Math.round(maxHeight),
      placement,
    };

    const current = this.panelPosition();
    if (
      current.top !== next.top ||
      current.left !== next.left ||
      current.width !== next.width ||
      current.maxHeight !== next.maxHeight ||
      current.placement !== next.placement
    ) {
      this.panelPosition.set(next);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.closePopover();
    }
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private attachGlobalListeners(): void {
    if (this.listenersAttached || typeof document === 'undefined') return;
    document.addEventListener('scroll', this.handleExternalScroll, true);
    document.addEventListener('keydown', this.handleDocumentKeydown, true);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleWindowResize);
    }
    this.listenersAttached = true;
  }

  private detachGlobalListeners(): void {
    if (!this.listenersAttached || typeof document === 'undefined') return;
    document.removeEventListener('scroll', this.handleExternalScroll, true);
    document.removeEventListener('keydown', this.handleDocumentKeydown, true);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleWindowResize);
    }
    this.listenersAttached = false;
  }
}
