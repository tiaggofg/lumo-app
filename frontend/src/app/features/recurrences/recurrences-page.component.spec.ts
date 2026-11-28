import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RecurringTransaction } from '../../core/models/api.models';
import { ZConfirmService } from '../../shared/ui';
import { CatalogStoreService } from '../catalog/catalog-store.service';
import { RecurrencesPageComponent } from './recurrences-page.component';
import { RecurrencesStoreService } from './recurrences-store.service';

describe('RecurrencesPageComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<RecurrencesPageComponent>;
  let component: RecurrencesPageComponent;
  let store: RecurrencesStoreService;
  let catalogStore: CatalogStoreService;
  let confirmService: ZConfirmService;

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
      ],
    });
    fixture = TestBed.createComponent(RecurrencesPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(RecurrencesStoreService);
    catalogStore = TestBed.inject(CatalogStoreService);
    confirmService = TestBed.inject(ZConfirmService);
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

    const confirmSpy = vi.spyOn(confirmService, 'confirm');
    component.confirmDelete(sampleRule);
    expect(confirmSpy).toHaveBeenCalled();

    expect(fixture.nativeElement.innerHTML).not.toContain('emerald-');
  });

  it('should render recurrence cards in three clean zones with metadata and maintenance actions', () => {
    vi.spyOn(catalogStore, 'loadAll').mockResolvedValue();
    vi.spyOn(store, 'loadRecurrences').mockResolvedValue();

    const richRule: RecurringTransaction = {
      ...sampleRule,
      id: 'r-rich',
      description: 'Internet Fibra',
      amount: 149.9,
      amountType: 'FIXED',
      recurrenceType: 'INDEFINITE',
      startMonth: '2026-11',
      dueDay: 15,
      categoryName: 'Contas Básicas',
      categoryColor: '#0284C7',
      beneficiaryName: 'Família',
      notes: 'Débito automático no banco principal',
      active: true,
    };

    store.recurrences.set([richRule]);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector(
      '[data-testid="recurrence-card-Internet Fibra"]'
    ) as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.className).toContain('h-full');
    expect(card.className).toContain('flex-col');

    const header = card.querySelector('[data-testid="recurrence-card-header"]') as HTMLElement;
    const body = card.querySelector('[data-testid="recurrence-card-body"]') as HTMLElement;
    const footer = card.querySelector('[data-testid="recurrence-card-footer"]') as HTMLElement;
    expect(header).toBeTruthy();
    expect(body).toBeTruthy();
    expect(footer).toBeTruthy();
    expect(footer.className).toContain('mt-auto');

    // Zone 1 checks
    expect(header.textContent).toContain('Internet Fibra');
    expect(header.querySelector('[data-testid="recurrence-card-status"]')?.textContent).toContain('Ativa');
    expect(header.querySelector('[data-testid="recurrence-card-amount-type"]')?.textContent).toContain('Fixo');

    // Zone 2 checks
    expect(body.querySelector('[data-testid="recurrence-card-mode"]')?.textContent).toContain('Indefinida');
    expect(body.querySelector('[data-testid="recurrence-card-start"]')?.textContent).toContain('Novembro 2026');
    expect(body.querySelector('[data-testid="recurrence-card-due-day"]')?.textContent).toContain('Dia 15');
    expect(body.querySelector('[data-testid="recurrence-card-category"]')?.textContent).toContain('Contas Básicas');
    const dot = body.querySelector('[data-testid="recurrence-card-category-dot"]') as HTMLElement;
    expect(dot.style.backgroundColor).toBe('rgb(2, 132, 199)');
    expect(body.querySelector('[data-testid="recurrence-card-beneficiary"]')?.textContent).toContain('Família');
    expect(body.querySelector('[data-testid="recurrence-card-notes"]')?.textContent).toContain(
      'Débito automático no banco principal'
    );
    expect(body.textContent).not.toContain('•');

    // Zone 3 checks
    expect(footer.querySelector('[data-testid="recurrence-card-type"]')?.textContent).toContain('Despesa');
    expect(footer.querySelector('[data-testid="recurrence-edit-btn"]')).toBeTruthy();
    const deactivateBtn = footer.querySelector('[data-testid="recurrence-deactivate-btn"]') as HTMLButtonElement;
    expect(deactivateBtn).toBeTruthy();
    expect(deactivateBtn.getAttribute('aria-label')).toBe('Desativar recorrência');
    expect(deactivateBtn.getAttribute('data-tooltip')).toBe('Desativar');

    const deleteBtn = footer.querySelector('[data-testid="recurrence-delete-btn"]') as HTMLButtonElement;
    expect(deleteBtn).toBeTruthy();
    expect(deleteBtn.getAttribute('aria-label')).toBe('Excluir recorrência');
    expect(deleteBtn.getAttribute('data-tooltip')).toBe('Excluir');

    // Clicking footer buttons invokes respective handlers
    deactivateBtn.click();
    fixture.detectChanges();
    expect(component.deactivateDialogVisible).toBe(true);
    expect(component.deactivatingRule()?.id).toBe('r-rich');

    const confirmSpy = vi.spyOn(confirmService, 'confirm');
    deleteBtn.click();
    expect(confirmSpy).toHaveBeenCalled();

    expect(card.innerHTML).not.toContain('emerald-');
    expect(card.innerHTML).not.toContain('green-');
  });

  it('should omit optional metadata cleanly without dangling separators and show Reativar on inactive cards', async () => {
    vi.spyOn(catalogStore, 'loadAll').mockResolvedValue();
    vi.spyOn(store, 'loadRecurrences').mockResolvedValue();

    const minimalInactiveRule: RecurringTransaction = {
      ...sampleRule,
      id: 'r-min',
      type: 'INCOME',
      description: 'Freelance Mensal',
      amount: 1200,
      amountType: 'ESTIMATED',
      recurrenceType: 'FIXED_TERM',
      startMonth: '2026-10',
      endMonth: '2026-12',
      dueDay: null,
      categoryId: null,
      categoryName: null,
      categoryColor: null,
      beneficiaryId: null,
      beneficiaryName: null,
      notes: null,
      active: false,
    };

    store.recurrences.set([minimalInactiveRule]);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector(
      '[data-testid="recurrence-card-Freelance Mensal"]'
    ) as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.getAttribute('data-active')).toBe('false');
    expect(card.className).toContain('border-dashed');
    expect(card.querySelector('[data-testid="recurrence-card-status"]')?.textContent).toContain('Inativa');
    expect(card.querySelector('[data-testid="recurrence-card-amount-type"]')?.textContent).toContain('Estimado');
    expect(card.querySelector('[data-testid="recurrence-card-due-day"]')).toBeNull();
    expect(card.querySelector('[data-testid="recurrence-card-category"]')).toBeNull();
    expect(card.querySelector('[data-testid="recurrence-card-beneficiary"]')).toBeNull();
    expect(card.querySelector('[data-testid="recurrence-card-notes"]')).toBeNull();
    expect(card.textContent).not.toContain('•');

    const activateBtn = card.querySelector('[data-testid="recurrence-activate-btn"]') as HTMLButtonElement;
    expect(activateBtn).toBeTruthy();
    expect(activateBtn.getAttribute('aria-label')).toBe('Reativar recorrência');
    expect(activateBtn.getAttribute('data-tooltip')).toBe('Reativar');
    expect(card.querySelector('[data-testid="recurrence-deactivate-btn"]')).toBeNull();

    const actSpy = vi.spyOn(store, 'activate').mockResolvedValue({ ...minimalInactiveRule, active: true });
    activateBtn.click();
    await Promise.resolve();
    expect(actSpy).toHaveBeenCalledWith('r-min');
  });

  it('should enable search only on category and beneficiary selects in recurrence modal', () => {
    vi.spyOn(catalogStore, 'loadAll').mockResolvedValue();
    vi.spyOn(store, 'loadRecurrences').mockResolvedValue();

    catalogStore.categories.set([
      { id: 'c1', name: 'Moradia', type: 'EXPENSE', color: '#4F46E5', icon: null, active: true, createdAt: '', updatedAt: '' },
      { id: 'c2', name: 'Alimentação', type: 'EXPENSE', color: '#0284C7', icon: null, active: true, createdAt: '', updatedAt: '' },
    ]);
    catalogStore.beneficiaries.set([
      { id: 'b1', name: 'Família', active: true, createdAt: '', updatedAt: '' },
      { id: 'b2', name: 'Cônjuge', active: true, createdAt: '', updatedAt: '' },
    ]);

    component.openFormDialog();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;

    // Non-searchable selects in modal
    for (const id of ['#rec-type', '#rec-amount-type', '#rec-mode']) {
      const trigger = host.querySelector(id) as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      expect(host.querySelector('[data-testid="z-select-search"]')).toBeNull();
      trigger.click();
      fixture.detectChanges();
    }

    // Searchable selects in modal: Category & Beneficiary
    const catTrigger = host.querySelector('#rec-cat') as HTMLButtonElement;
    catTrigger.click();
    fixture.detectChanges();
    const catSearch = host.querySelector('[data-testid="z-select-search"]') as HTMLInputElement;
    expect(catSearch).toBeTruthy();
    catSearch.value = 'alimentacao';
    catSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.querySelectorAll('[role="option"]')).toHaveLength(1);
    catTrigger.click();
    fixture.detectChanges();

    const benTrigger = host.querySelector('#rec-ben') as HTMLButtonElement;
    benTrigger.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="z-select-search"]')).toBeTruthy();
  });
});
