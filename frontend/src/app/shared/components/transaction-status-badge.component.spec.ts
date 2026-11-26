import { TestBed } from '@angular/core/testing';
import { TransactionStatusBadgeComponent } from './transaction-status-badge.component';

describe('TransactionStatusBadgeComponent', () => {
  it('should render Pago for EXPENSE + SETTLED', () => {
    const fixture = TestBed.createComponent(TransactionStatusBadgeComponent);
    fixture.componentRef.setInput('status', 'SETTLED');
    fixture.componentRef.setInput('type', 'EXPENSE');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pago');
  });

  it('should render Recebido for INCOME + SETTLED', () => {
    const fixture = TestBed.createComponent(TransactionStatusBadgeComponent);
    fixture.componentRef.setInput('status', 'SETTLED');
    fixture.componentRef.setInput('type', 'INCOME');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Recebido');
  });

  it('should render Pendente and Estimado for open statuses', () => {
    const fixture = TestBed.createComponent(TransactionStatusBadgeComponent);
    fixture.componentRef.setInput('status', 'PENDING');
    fixture.componentRef.setInput('type', 'EXPENSE');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pendente');

    fixture.componentRef.setInput('status', 'ESTIMATED');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Estimado');
  });
});
