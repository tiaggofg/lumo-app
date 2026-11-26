import { TestBed } from '@angular/core/testing';
import { TransactionStatusBadgeComponent } from './transaction-status-badge.component';

describe('TransactionStatusBadgeComponent', () => {
  it('should render Pago with Sapphire Blue (sky-*) classes for EXPENSE + SETTLED', () => {
    const fixture = TestBed.createComponent(TransactionStatusBadgeComponent);
    fixture.componentRef.setInput('status', 'SETTLED');
    fixture.componentRef.setInput('type', 'EXPENSE');
    fixture.detectChanges();

    const badge: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(badge.textContent).toContain('Pago');
    expect(badge.className).toContain('bg-sky-100');
    expect(badge.className).toContain('text-sky-800');
    expect(badge.className).not.toContain('emerald-');
  });

  it('should render Recebido with Sapphire Blue (sky-*) classes for INCOME + SETTLED', () => {
    const fixture = TestBed.createComponent(TransactionStatusBadgeComponent);
    fixture.componentRef.setInput('status', 'SETTLED');
    fixture.componentRef.setInput('type', 'INCOME');
    fixture.detectChanges();

    const badge: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(badge.textContent).toContain('Recebido');
    expect(badge.className).toContain('bg-sky-100');
    expect(badge.className).toContain('text-sky-800');
  });

  it('should render Pendente (indigo) and Estimado (amber) with enlarged typography', () => {
    const fixture = TestBed.createComponent(TransactionStatusBadgeComponent);
    fixture.componentRef.setInput('status', 'PENDING');
    fixture.componentRef.setInput('type', 'EXPENSE');
    fixture.detectChanges();

    const badge: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(badge.textContent).toContain('Pendente');
    expect(badge.className).toContain('text-[13px]');
    expect(badge.className).toContain('px-3');
    expect(badge.className).toContain('py-1');

    fixture.componentRef.setInput('status', 'ESTIMATED');
    fixture.detectChanges();
    expect(badge.textContent).toContain('Estimado');
    expect(badge.className).toContain('bg-amber-100');
    expect(badge.className).toContain('text-amber-800');
  });
});
