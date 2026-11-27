import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  effect,
  inject,
  input,
} from '@angular/core';

export type ZTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[zTooltip]',
  standalone: true,
})
export class ZTooltipDirective implements OnDestroy {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly zTooltip = input<string>('');
  readonly tooltipPosition = input<ZTooltipPosition>('top');

  private tooltipEl: HTMLDivElement | null = null;

  constructor() {
    effect(() => {
      const text = this.zTooltip();
      const el = this.hostRef.nativeElement;
      if (text) {
        el.setAttribute('data-tooltip', text);
      } else {
        el.removeAttribute('data-tooltip');
        this.hideTooltip();
      }
    });
  }

  @HostListener('mouseenter')
  @HostListener('focusin')
  showTooltip(): void {
    const text = this.zTooltip()?.trim();
    if (!text || typeof document === 'undefined') return;

    this.hideTooltip();

    const tip = document.createElement('div');
    tip.setAttribute('role', 'tooltip');
    tip.setAttribute('data-testid', 'z-tooltip-popover');
    tip.className =
      'fixed z-50 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium shadow-lg border border-slate-700/80 pointer-events-none whitespace-nowrap transition-opacity';
    tip.textContent = text;
    document.body.appendChild(tip);

    const hostRect = this.hostRef.nativeElement.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const pos = this.tooltipPosition();
    const offset = 8;

    let top = hostRect.top - tipRect.height - offset;
    let left = hostRect.left + hostRect.width / 2 - tipRect.width / 2;

    if (pos === 'bottom') {
      top = hostRect.bottom + offset;
    } else if (pos === 'right') {
      top = hostRect.top + hostRect.height / 2 - tipRect.height / 2;
      left = hostRect.right + offset;
    } else if (pos === 'left') {
      top = hostRect.top + hostRect.height / 2 - tipRect.height / 2;
      left = hostRect.left - tipRect.width - offset;
    }

    tip.style.top = `${Math.max(4, top)}px`;
    tip.style.left = `${Math.max(4, left)}px`;
    this.tooltipEl = tip;
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  hideTooltip(): void {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }

  ngOnDestroy(): void {
    this.hideTooltip();
  }
}
