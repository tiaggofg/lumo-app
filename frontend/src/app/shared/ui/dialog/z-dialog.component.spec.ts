import { TestBed } from '@angular/core/testing';
import { ZConfirmDialogComponent } from '../alert-dialog/z-confirm-dialog.component';
import { ZConfirmService } from '../alert-dialog/z-confirm.service';
import { ZDialogComponent } from './z-dialog.component';

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
