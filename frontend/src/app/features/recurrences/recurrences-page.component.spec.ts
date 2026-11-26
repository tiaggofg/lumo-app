import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RecurringTransaction } from '../../core/models/api.models';
import { CatalogStoreService } from '../catalog/catalog-store.service';
import { RecurrencesPageComponent } from './recurrences-page.component';
import { RecurrencesStoreService } from './recurrences-store.service';

describe('RecurrencesPageComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<RecurrencesPageComponent>;
  let component: RecurrencesPageComponent;
  let store: RecurrencesStoreService;
  let catalogStore: CatalogStoreService;
  let confirmationService: ConfirmationService;

  const sampleRule: RecurringTransaction = {
    id: 'r1',
    type: 'EXPENSE',
    description: 'Aluguel',
    amount: 800,
    amountType: 'FIXED',
    recurrenceType: 'INDEFINITE',
    startMonth: '2026-11',
    endMonth: null,
    totalInstallments: null,
    startingInstallment: null,
    dueDay: 5,
    categoryId: 'c1',
    categoryName: 'Moradia',
    categoryColor: '#6366F1',
    beneficiaryId: 'b1',
    beneficiaryName: 'Família',
    notes: null,
    active: true,
    hasGeneratedTransactions: false,
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RecurrencesPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ConfirmationService,
        MessageService,
      ],
    });
    fixture = TestBed.createComponent(RecurrencesPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(RecurrencesStoreService);
    catalogStore = TestBed.inject(CatalogStoreService);
    confirmationService = TestBed.inject(ConfirmationService);
  });

  it('should enforce endMonth >= startMonth for FIXED_TERM', () => {
    component.form.description = 'Dentista';
    component.form.amount = 150;
    component.form.recurrenceType = 'FIXED_TERM';
    component.form.startMonth = '2026-11';
    component.form.endMonth = '2026-10';
    expect(component.isFormValid()).toBe(false);

    component.form.endMonth = '2026-11';
    expect(component.isFormValid()).toBe(true);
  });

  it('should enforce totalInstallments >= 2 and startingInstallment bounds for INSTALLMENT', () => {
    component.form.description = 'Cartão Sogra';
    component.form.amount = 58.66;
    component.form.recurrenceType = 'INSTALLMENT';
    component.form.startMonth = '2026-11';
    component.form.totalInstallments = 1;
    component.form.startingInstallment = 1;
    expect(component.isFormValid()).toBe(false);

    component.form.totalInstallments = 6;
    component.form.startingInstallment = 7;
    expect(component.isFormValid()).toBe(false);

    component.form.startingInstallment = 4;
    expect(component.isFormValid()).toBe(true);
  });

  it('should render cards/dialogs, format modeLabel and invoke CRUD actions', async () => {
    vi.spyOn(catalogStore, 'loadAll').mockResolvedValue();
    vi.spyOn(store, 'loadRecurrences').mockResolvedValue();
    fixture.detectChanges();

    store.recurrences.set([
      sampleRule,
      { ...sampleRule, id: 'r2', active: false, type: 'INCOME', amountType: 'ESTIMATED' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aluguel');

    expect(component.modeLabel(sampleRule)).toBe('Indefinida');
    expect(component.modeLabel({ ...sampleRule, recurrenceType: 'FIXED_TERM', endMonth: '2026-11' })).toBe('Até 2026-11');
    expect(component.modeLabel({ ...sampleRule, recurrenceType: 'INSTALLMENT', startingInstallment: 4, totalInstallments: 6 })).toBe('Parcelas 4/6');

    component.openFormDialog();
    component.form.recurrenceType = 'FIXED_TERM';
    fixture.detectChanges();
    component.form.recurrenceType = 'INSTALLMENT';
    fixture.detectChanges();
    component.form.recurrenceType = 'INDEFINITE';
    component.form.description = 'Aluguel';
    component.form.amount = 800;
    const createSpy = vi.spyOn(store, 'create').mockResolvedValue({ recurrence: sampleRule, materializedBudgetIds: ['b1'] });
    await component.save();
    expect(createSpy).toHaveBeenCalled();

    component.openFormDialog(sampleRule);
    fixture.detectChanges();
    const updateSpy = vi.spyOn(store, 'update').mockResolvedValue({ recurrence: sampleRule, propagatedCount: 1 });
    await component.save();
    expect(updateSpy).toHaveBeenCalled();

    component.openDeactivateDialog(sampleRule);
    fixture.detectChanges();
    const deactSpy = vi.spyOn(store, 'deactivate').mockResolvedValue({ recurrence: { ...sampleRule, active: false }, removedTransactionsCount: 1 });
    await component.confirmDeactivate();
    expect(deactSpy).toHaveBeenCalled();

    const actSpy = vi.spyOn(store, 'activate').mockResolvedValue(sampleRule);
    await component.activate(sampleRule);
    expect(actSpy).toHaveBeenCalledWith('r1');

    const confirmSpy = vi.spyOn(confirmationService, 'confirm');
    component.confirmDelete(sampleRule);
    expect(confirmSpy).toHaveBeenCalled();
  });
});
