import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ZSelectComponent } from './z-select.component';

@Component({
  standalone: true,
  imports: [FormsModule, ZSelectComponent],
  template: `
    <z-select
      inputId="cat-select"
      [(ngModel)]="selectedId"
      [options]="options"
      optionLabel="name"
      optionValue="id"
      placeholder="Selecione categoria"
      [showClear]="true"
    />
  `,
})
class SelectHostComponent {
  selectedId: string | null = 'c1';
  options = [
    { id: 'c1', name: 'Moradia' },
    { id: 'c2', name: 'Alimentação' },
  ];
}

function mockDomRect(partial: Partial<DOMRect>): DOMRect {
  const top = partial.top ?? 0;
  const left = partial.left ?? 0;
  const width = partial.width ?? 220;
  const height = partial.height ?? 44;
  return {
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    right: partial.right ?? left + width,
    bottom: partial.bottom ?? top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('ZSelectComponent', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: originalInnerHeight,
    });
  });

  it('should render selected option label, open listbox, select option, and clear selection', async () => {
    const fixture = TestBed.createComponent(SelectHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const trigger: HTMLButtonElement | null = host.querySelector('[data-testid="z-select-trigger"]');
    expect(trigger).toBeTruthy();
    expect(trigger?.textContent).toContain('Moradia');

    // Open dropdown
    trigger?.click();
    fixture.detectChanges();

    const listbox = host.querySelector('[data-testid="z-select-listbox"]');
    expect(listbox).toBeTruthy();
    const items = host.querySelectorAll('[role="option"]');
    expect(items).toHaveLength(2);

    // Select second option
    (items[1] as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedId).toBe('c2');
    expect(trigger?.textContent).toContain('Alimentação');
    expect(host.querySelector('[data-testid="z-select-listbox"]')).toBeNull();

    // Clear selection
    const clearBtn: HTMLButtonElement | null = host.querySelector('[data-testid="z-select-clear"]');
    expect(clearBtn).toBeTruthy();
    clearBtn?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedId).toBeNull();
    expect(trigger?.textContent).toContain('Selecione categoria');
  });

  it('should close dropdown on Escape key and outside click', () => {
    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('options', [{ label: 'Ativas', value: true }]);
    fixture.detectChanges();

    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(escapeEvent);
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(escapeEvent.defaultPrevented).toBe(true);

    // Reopen and click outside
    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('should prevent opening dropdown when disabled', () => {
    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();
    fixture.componentInstance.toggleOpen();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('should render empty state message when options array is empty', () => {
    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('options', []);
    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhuma opção disponível');
  });

  it('should support primitive string options without optionLabel/optionValue object keys', () => {
    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('options', ['2026-10', '2026-11']);
    fixture.componentInstance.writeValue('2026-11');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedLabel()).toBe('2026-11');
  });

  it('should render popover with fixed viewport positioning and keep dialog scroll unchanged', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });

    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('options', [
      { label: 'Moradia', value: 'c1' },
      { label: 'Alimentação', value: 'c2' },
      { label: 'Transporte', value: 'c3' },
    ]);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '[data-testid="z-select-trigger"]'
    ) as HTMLButtonElement;
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
      mockDomRect({ top: 180, left: 320, width: 260, height: 44 })
    );

    const scrollBefore = fixture.nativeElement.scrollHeight;
    trigger.click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '[data-testid="z-select-panel"]'
    ) as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.className).toContain('fixed');
    expect(panel.className).toContain('z-[70]');
    expect(panel.getAttribute('data-placement')).toBe('bottom');
    expect(panel.style.top).toBe('230px');
    expect(panel.style.left).toBe('320px');
    expect(panel.style.width).toBe('260px');
    expect(fixture.nativeElement.scrollHeight).toBe(scrollBefore);
  });

  it('should flip popover above trigger when viewport space below is insufficient', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });

    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput(
      'options',
      Array.from({ length: 10 }, (_, idx) => ({ label: `Categoria ${idx + 1}`, value: `c${idx}` }))
    );
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '[data-testid="z-select-trigger"]'
    ) as HTMLButtonElement;
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
      mockDomRect({ top: 620, left: 200, width: 240, height: 44 })
    );

    trigger.click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '[data-testid="z-select-panel"]'
    ) as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute('data-placement')).toBe('top');
    const panelTop = Number.parseFloat(panel.style.top);
    expect(panelTop).toBeGreaterThanOrEqual(8);
    expect(panelTop).toBeLessThan(620);
  });

  it('should filter options case-insensitively and accent-insensitively when searchable is true', () => {
    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('searchPlaceholder', 'Buscar categoria...');
    fixture.componentRef.setInput('options', [
      { label: 'Moradia', value: 'c1' },
      { label: 'Alimentação', value: 'c2' },
      { label: 'Saúde', value: 'c3' },
      { label: 'Educação', value: 'c4' },
    ]);
    fixture.detectChanges();

    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector(
      '[data-testid="z-select-search"]'
    ) as HTMLInputElement;
    expect(searchInput).toBeTruthy();
    expect(searchInput.placeholder).toBe('Buscar categoria...');
    expect(document.activeElement).toBe(searchInput);

    // Filter without accents and mixed case
    searchInput.value = 'ALIMENTACAO';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    let items = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Alimentação');

    // Filter another accented option
    searchInput.value = 'saude';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    items = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Saúde');
  });

  it('should omit search input when searchable is false', () => {
    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('searchable', false);
    fixture.componentRef.setInput('options', [
      { label: 'Despesa', value: 'EXPENSE' },
      { label: 'Receita', value: 'INCOME' },
    ]);
    fixture.detectChanges();

    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="z-select-search"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[role="option"]')).toHaveLength(2);
  });

  it('should clear search query after selecting an option or closing popover', () => {
    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('options', [
      { label: 'Moradia', value: 'c1' },
      { label: 'Alimentação', value: 'c2' },
    ]);
    fixture.detectChanges();

    // Open, type, select -> reopen must show all options with empty search
    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector(
      '[data-testid="z-select-search"]'
    ) as HTMLInputElement;
    searchInput.value = 'alimentacao';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const matchedItem = fixture.nativeElement.querySelector('[role="option"]') as HTMLElement;
    matchedItem.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.searchQuery()).toBe('');

    // Reopen, type, then close with Escape -> search must be cleared
    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="option"]')).toHaveLength(2);

    const searchInput2 = fixture.nativeElement.querySelector(
      '[data-testid="z-select-search"]'
    ) as HTMLInputElement;
    searchInput2.value = 'moradia';
    searchInput2.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.searchQuery()).toBe('');
  });

  it('should display no-results message when search matches no options', () => {
    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('options', [
      { label: 'Moradia', value: 'c1' },
      { label: 'Alimentação', value: 'c2' },
    ]);
    fixture.detectChanges();

    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector(
      '[data-testid="z-select-search"]'
    ) as HTMLInputElement;
    searchInput.value = 'zzzz-inexistente';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[data-testid="z-select-empty"]')?.textContent).toContain(
      'Nenhum resultado encontrado'
    );
  });

  it('should reposition or close popover on external scroll or window resize', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });

    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('options', [
      { label: 'Moradia', value: 'c1' },
      { label: 'Alimentação', value: 'c2' },
    ]);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '[data-testid="z-select-trigger"]'
    ) as HTMLButtonElement;
    let currentRect = mockDomRect({ top: 150, left: 260, width: 220, height: 44 });
    vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(() => currentRect);

    trigger.click();
    fixture.detectChanges();

    // Clamped inside mobile 375px viewport (left <= 375 - 220 - 8 = 147)
    const panel = fixture.nativeElement.querySelector(
      '[data-testid="z-select-panel"]'
    ) as HTMLElement;
    expect(Number.parseFloat(panel.style.left)).toBeLessThanOrEqual(147);
    expect(panel.style.top).toBe('200px');

    // Internal listbox scroll does NOT close popover
    const listbox = fixture.nativeElement.querySelector(
      '[data-testid="z-select-listbox"]'
    ) as HTMLElement;
    listbox.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    // External scroll repositions popover when trigger remains visible
    currentRect = mockDomRect({ top: 210, left: 100, width: 220, height: 44 });
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);
    expect(panel.style.top).toBe('260px');

    // External scroll closes popover when trigger leaves viewport
    currentRect = mockDomRect({ top: -60, bottom: -16, left: 100, width: 220, height: 44 });
    document.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('should keep popover open when clicking inside search input or clear-search button', () => {
    const fixture = TestBed.createComponent(ZSelectComponent);
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('options', [
      { label: 'Moradia', value: 'c1' },
      { label: 'Alimentação', value: 'c2' },
    ]);
    fixture.detectChanges();

    fixture.componentInstance.toggleOpen();
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector(
      '[data-testid="z-select-search"]'
    ) as HTMLInputElement;
    searchInput.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    searchInput.value = 'mor';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const clearSearchBtn = fixture.nativeElement.querySelector(
      '[data-testid="z-select-search-clear"]'
    ) as HTMLButtonElement;
    expect(clearSearchBtn).toBeTruthy();
    clearSearchBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.componentInstance.searchQuery()).toBe('');
  });
});
