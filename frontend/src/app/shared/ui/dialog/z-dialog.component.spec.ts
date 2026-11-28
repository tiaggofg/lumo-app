import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZConfirmDialogComponent } from '../alert-dialog/z-confirm-dialog.component';
import { ZConfirmService } from '../alert-dialog/z-confirm.service';
import { ZSelectComponent } from '../select/z-select.component';
import { ZDialogComponent } from './z-dialog.component';

@Component({
  standalone: true,
  imports: [ZDialogComponent, ZSelectComponent],
  template: `
    <z-dialog header="Novo Lançamento" [(visible)]="visible">
      <z-select
        inputId="dialog-cat"
        [options]="options"
        [searchable]="true"
      />
    </z-dialog>
  `,
})
class DialogWithSelectHostComponent {
  visible = true;
  options = [
    { label: 'Moradia', value: 'c1' },
    { label: 'Alimentação', value: 'c2' },
  ];
}

describe('ZDialogComponent & ZConfirmDialogComponent', () => {
  it('should render modal overlay when visible is true and close on Escape or close button', () => {
    const fixture = TestBed.createComponent(ZDialogComponent);
    fixture.componentRef.setInput('header', 'Novo Orçamento');
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[data-testid="z-dialog-overlay"]')).toBeTruthy();
    expect(host.textContent).toContain('Novo Orçamento');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.visible()).toBe(false);
    expect(host.querySelector('[data-testid="z-dialog-overlay"]')).toBeNull();
  });

  it('should keep dialog open when Escape is consumed by an inner open select', () => {
    const fixture = TestBed.createComponent(DialogWithSelectHostComponent);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[data-testid="z-dialog-overlay"]')).toBeTruthy();

    // Open inner select
    const trigger = host.querySelector('[data-testid="z-select-trigger"]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="z-select-panel"]')).toBeTruthy();

    // First Escape dispatched on search input (real browser bubble/capture path) closes only the select
    const searchInput = host.querySelector('[data-testid="z-select-search"]') as HTMLInputElement;
    const firstEscape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    searchInput.dispatchEvent(firstEscape);
    fixture.detectChanges();

    expect(firstEscape.defaultPrevented).toBe(true);
    expect(host.querySelector('[data-testid="z-select-panel"]')).toBeNull();
    expect(fixture.componentInstance.visible).toBe(true);
    expect(host.querySelector('[data-testid="z-dialog-overlay"]')).toBeTruthy();

    // Reopen select and dispatch Escape directly on document -> still keeps dialog open
    trigger.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="z-select-panel"]')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="z-select-panel"]')).toBeNull();
    expect(fixture.componentInstance.visible).toBe(true);

    // Next Escape when no select is open closes the dialog
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.visible).toBe(false);
    expect(host.querySelector('[data-testid="z-dialog-overlay"]')).toBeNull();
  });

  it('should ignore Escape when event.defaultPrevented is already true', () => {
    const fixture = TestBed.createComponent(ZDialogComponent);
    fixture.componentRef.setInput('header', 'Teste');
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    const preventedEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    preventedEvent.preventDefault();
    fixture.componentInstance.onEscapeKey(preventedEvent);
    fixture.detectChanges();

    expect(fixture.componentInstance.visible()).toBe(true);
  });

  it('should open ZConfirmDialogComponent via ZConfirmService and execute accept or reject callbacks', () => {
    const fixture = TestBed.createComponent(ZConfirmDialogComponent);
    const confirmService = TestBed.inject(ZConfirmService);

    let accepted = false;
    let rejected = false;
    confirmService.confirm({
      header: 'Excluir Lançamento',
      message: 'Deseja realmente excluir este lançamento?',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      accept: () => {
        accepted = true;
      },
      reject: () => {
        rejected = true;
      },
    });
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('[data-testid="z-confirm-dialog"]')).toBeTruthy();
    expect(host.textContent).toContain('Excluir Lançamento');

    const acceptBtn: HTMLButtonElement | null = host.querySelector(
      '[data-testid="z-confirm-accept"] button'
    );
    expect(acceptBtn).toBeTruthy();
    acceptBtn?.click();
    fixture.detectChanges();

    expect(accepted).toBe(true);
    expect(rejected).toBe(false);
    expect(confirmService.activeConfirmation()).toBeNull();

    // Test reject path
    confirmService.confirm({
      header: 'Excluir Categoria',
      message: 'Deseja excluir?',
      accept: () => undefined,
      reject: () => {
        rejected = true;
      },
    });
    fixture.detectChanges();
    const rejectBtn: HTMLButtonElement | null = host.querySelector(
      '[data-testid="z-confirm-reject"] button'
    );
    rejectBtn?.click();
    fixture.detectChanges();
    expect(rejected).toBe(true);
  });
});
