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

describe('ZSelectComponent', () => {
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

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);

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
});
