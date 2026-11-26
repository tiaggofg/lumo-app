import { TestBed } from '@angular/core/testing';
import { Transaction } from '../../core/models/api.models';
import { ConfirmEstimateDialogComponent } from './confirm-estimate-dialog.component';

describe('ConfirmEstimateDialogComponent', () => {
  const baseTxn: Transaction = {
    id: 't1',
    monthlyBudgetId: 'b1',
    type: 'EXPENSE',
    description: 'Água',
    amount: 180,
    status: 'ESTIMATED',
    dueDate: '2026-11-20',
    paymentDate: null,
    notes: null,
    categoryId: null,
    categoryName: null,
    categoryColor: null,
    beneficiaryId: null,
    beneficiaryName: null,
    sourceRecurringTransactionId: 'r1',
    installmentCurrent: null,
    installmentTotal: null,
    createdAt: '',
    updatedAt: '',
  };

  it('should populate form from transaction and emit confirmed payload', () => {
    const fixture = TestBed.createComponent(ConfirmEstimateDialogComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('transaction', baseTxn);
    fixture.detectChanges();

    expect(component.amount).toBe(180);
    const emitted: unknown[] = [];
    component.confirmed.subscribe((val) => emitted.push(val));

    component.amount = 195.64;
    component.targetStatus = 'SETTLED';
    component.updateRecurringTemplate = true;
    component.submit();

    expect(emitted).toEqual([
      { amount: 195.64, targetStatus: 'SETTLED', updateRecurringTemplate: true },
    ]);
  });

  it('should ignore submit when amount is zero or negative', () => {
    const fixture = TestBed.createComponent(ConfirmEstimateDialogComponent);
    const component = fixture.componentInstance;
    const emitted: unknown[] = [];
    component.confirmed.subscribe((val) => emitted.push(val));

    component.amount = 0;
    component.submit();
    expect(emitted).toEqual([]);
  });
});
