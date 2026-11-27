import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Beneficiary, Category, TransactionType } from '../../core/models/api.models';
import {
  ZButtonComponent,
  ZConfirmService,
  ZDialogComponent,
  ZInputDirective,
  ZSelectComponent,
  ZToastService,
} from '../../shared/ui';
import { CatalogStoreService } from './catalog-store.service';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    FormsModule,
    ZButtonComponent,
    ZDialogComponent,
    ZInputDirective,
    ZSelectComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Cadastros</h1>
          <p class="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            Gerencie categorias de receitas e despesas e beneficiários da família.
          </p>
        </div>

        <div class="flex items-center gap-2">
          @if (activeTab() === 'categories') {
            <z-button
              label="Nova Categoria"
              icon="pi pi-plus"
              data-testid="new-category-btn"
              (buttonClick)="openCategoryDialog()"
            />
          } @else {
            <z-button
              label="Novo Beneficiário"
              icon="pi pi-plus"
              data-testid="new-beneficiary-btn"
              (buttonClick)="openBeneficiaryDialog()"
            />
          }
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          data-testid="tab-categories"
          (click)="activeTab.set('categories')"
          [class]="
            activeTab() === 'categories'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          "
          class="px-4 py-3 text-[15px] transition-colors cursor-pointer"
        >
          Categorias ({{ store.categories().length }})
        </button>
        <button
          type="button"
          data-testid="tab-beneficiaries"
          (click)="activeTab.set('beneficiaries')"
          [class]="
            activeTab() === 'beneficiaries'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          "
          class="px-4 py-3 text-[15px] transition-colors cursor-pointer"
        >
          Beneficiários ({{ store.beneficiaries().length }})
        </button>
      </div>

      <!-- Categories Tab -->
      @if (activeTab() === 'categories') {
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            @for (filter of categoryTypeFilters; track filter.value) {
              <button
                type="button"
                (click)="categoryTypeFilter.set(filter.value)"
                [class]="
                  categoryTypeFilter() === filter.value
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 font-medium'
                "
                class="px-3.5 py-2 rounded-xl text-sm transition-colors cursor-pointer"
              >
                {{ filter.label }}
              </button>
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            @for (cat of filteredCategories(); track cat.id) {
              <div
                class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                [class.opacity-60]="!cat.active"
              >
                <div class="flex items-center gap-3.5 min-w-0">
                  <span
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    [style.background-color]="cat.color || '#4F46E5'"
                  >
                    <i [class]="cat.icon || 'pi pi-tag'" aria-hidden="true"></i>
                  </span>
                  <div class="min-w-0">
                    <div class="font-semibold text-[15px] truncate">{{ cat.name }}</div>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="text-xs text-slate-500 dark:text-slate-400">
                        {{ cat.type === 'EXPENSE' ? 'Despesa' : 'Receita' }}
                      </span>
                      <span class="text-slate-300 dark:text-slate-700">•</span>
                      <span
                        class="text-xs font-semibold"
                        [class]="cat.active ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'"
                      >
                        {{ cat.active ? 'Ativa' : 'Inativa' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    (click)="openCategoryDialog(cat)"
                    class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Editar categoria"
                    aria-label="Editar categoria"
                  >
                    <i class="pi pi-pencil text-sm" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    (click)="toggleCategory(cat)"
                    class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    [title]="cat.active ? 'Desativar' : 'Reativar'"
                    [attr.aria-label]="cat.active ? 'Desativar categoria' : 'Reativar categoria'"
                  >
                    <i [class]="cat.active ? 'pi pi-eye-slash text-sm' : 'pi pi-eye text-sm'" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    (click)="confirmDeleteCategory(cat)"
                    class="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Excluir categoria"
                    aria-label="Excluir categoria"
                  >
                    <i class="pi pi-trash text-sm" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Beneficiaries Tab -->
      @if (activeTab() === 'beneficiaries') {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          @for (ben of store.beneficiaries(); track ben.id) {
            <div
              class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm"
              [class.opacity-60]="!ben.active"
            >
              <div class="flex items-center gap-3.5 min-w-0">
                <span class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-base shrink-0">
                  {{ ben.name.charAt(0).toUpperCase() }}
                </span>
                <div class="min-w-0">
                  <div class="font-semibold text-[15px] truncate">{{ ben.name }}</div>
                  <span
                    class="text-xs font-semibold"
                    [class]="ben.active ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'"
                  >
                    {{ ben.active ? 'Ativo' : 'Inativo' }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  (click)="openBeneficiaryDialog(ben)"
                  class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Editar beneficiário"
                  aria-label="Editar beneficiário"
                >
                  <i class="pi pi-pencil text-xs" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  (click)="toggleBeneficiary(ben)"
                  class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  [title]="ben.active ? 'Desativar' : 'Reativar'"
                  [attr.aria-label]="ben.active ? 'Desativar beneficiário' : 'Reativar beneficiário'"
                >
                  <i [class]="ben.active ? 'pi pi-eye-slash text-xs' : 'pi pi-eye text-xs'" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  (click)="confirmDeleteBeneficiary(ben)"
                  class="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Excluir beneficiário"
                  aria-label="Excluir beneficiário"
                >
                  <i class="pi pi-trash text-xs" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Category Dialog -->
    <z-dialog
      [header]="editingCategoryId() ? 'Editar Categoria' : 'Nova Categoria'"
      [(visible)]="categoryDialogVisible"
      widthClass="max-w-md"
    >
      <div class="space-y-4 pt-1">
        <div class="flex flex-col gap-1.5">
          <label for="cat-name" class="text-sm font-medium">Nome</label>
          <input
            id="cat-name"
            zInput
            [(ngModel)]="categoryForm.name"
            maxlength="80"
            placeholder="Ex.: Pets"
          />
        </div>

        @if (!editingCategoryId()) {
          <div class="flex flex-col gap-1.5">
            <label for="cat-type" class="text-sm font-medium">Tipo</label>
            <z-select
              inputId="cat-type"
              [(ngModel)]="categoryForm.type"
              [options]="typeOptions"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
            />
          </div>
        }

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="cat-color" class="text-sm font-medium">Cor</label>
            <div class="flex items-center gap-2">
              <input
                id="cat-color"
                type="color"
                [(ngModel)]="categoryForm.color"
                class="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
              />
              <input zInput [(ngModel)]="categoryForm.color" class="text-xs" />
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="cat-icon" class="text-sm font-medium">Ícone</label>
            <z-select
              inputId="cat-icon"
              [(ngModel)]="categoryForm.icon"
              [options]="iconOptions"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
            />
          </div>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <z-button label="Cancelar" variant="ghost" (buttonClick)="categoryDialogVisible = false" />
          <z-button
            label="Salvar"
            data-testid="save-category-btn"
            [loading]="saving()"
            [disabled]="!categoryForm.name.trim()"
            (buttonClick)="saveCategory()"
          />
        </div>
      </ng-template>
    </z-dialog>

    <!-- Beneficiary Dialog -->
    <z-dialog
      [header]="editingBeneficiaryId() ? 'Editar Beneficiário' : 'Novo Beneficiário'"
      [(visible)]="beneficiaryDialogVisible"
      widthClass="max-w-md"
    >
      <div class="space-y-4 pt-1">
        <div class="flex flex-col gap-1.5">
          <label for="ben-name" class="text-sm font-medium">Nome</label>
          <input
            id="ben-name"
            zInput
            [(ngModel)]="beneficiaryName"
            maxlength="80"
            placeholder="Ex.: Tiago"
          />
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <z-button label="Cancelar" variant="ghost" (buttonClick)="beneficiaryDialogVisible = false" />
          <z-button
            label="Salvar"
            data-testid="save-beneficiary-btn"
            [loading]="saving()"
            [disabled]="!beneficiaryName.trim()"
            (buttonClick)="saveBeneficiary()"
          />
        </div>
      </ng-template>
    </z-dialog>
  `,
})
export class CatalogPageComponent implements OnInit {
  readonly store = inject(CatalogStoreService);
  private readonly confirmService = inject(ZConfirmService);
  private readonly toastService = inject(ZToastService);

  readonly activeTab = signal<'categories' | 'beneficiaries'>('categories');
  readonly categoryTypeFilter = signal<'ALL' | TransactionType>('ALL');
  readonly saving = signal(false);

  readonly editingCategoryId = signal<string | null>(null);
  categoryDialogVisible = false;
  categoryForm: { name: string; type: TransactionType; color: string; icon: string } = {
    name: '',
    type: 'EXPENSE',
    color: '#4F46E5',
    icon: 'pi pi-tag',
  };

  readonly editingBeneficiaryId = signal<string | null>(null);
  beneficiaryDialogVisible = false;
  beneficiaryName = '';

  readonly categoryTypeFilters: { label: string; value: 'ALL' | TransactionType }[] = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Despesas', value: 'EXPENSE' },
    { label: 'Receitas', value: 'INCOME' },
  ];

  readonly typeOptions = [
    { label: 'Despesa', value: 'EXPENSE' as TransactionType },
    { label: 'Receita', value: 'INCOME' as TransactionType },
  ];

  readonly iconOptions = [
    { label: 'Tag', value: 'pi pi-tag' },
    { label: 'Casa', value: 'pi pi-home' },
    { label: 'Energia', value: 'pi pi-bolt' },
    { label: 'Cartão', value: 'pi pi-credit-card' },
    { label: 'Saúde', value: 'pi pi-heart' },
    { label: 'Educação', value: 'pi pi-book' },
    { label: 'Mercado', value: 'pi pi-shopping-cart' },
    { label: 'Carro', value: 'pi pi-car' },
    { label: 'Estrela', value: 'pi pi-star' },
    { label: 'Carteira', value: 'pi pi-wallet' },
  ];

  readonly filteredCategories = computed(() => {
    const filter = this.categoryTypeFilter();
    const list = this.store.categories();
    return filter === 'ALL' ? list : list.filter((c) => c.type === filter);
  });

  ngOnInit(): void {
    void this.store.loadAll();
  }

  openCategoryDialog(category?: Category): void {
    if (category) {
      this.editingCategoryId.set(category.id);
      this.categoryForm = {
        name: category.name,
        type: category.type,
        color: category.color || '#4F46E5',
        icon: category.icon || 'pi pi-tag',
      };
    } else {
      this.editingCategoryId.set(null);
      this.categoryForm = {
        name: '',
        type: 'EXPENSE',
        color: '#4F46E5',
        icon: 'pi pi-tag',
      };
    }
    this.categoryDialogVisible = true;
  }

  async saveCategory(): Promise<void> {
    if (!this.categoryForm.name.trim()) return;
    this.saving.set(true);
    try {
      const id = this.editingCategoryId();
      if (id) {
        await this.store.updateCategory(id, {
          name: this.categoryForm.name.trim(),
          color: this.categoryForm.color,
          icon: this.categoryForm.icon,
        });
        this.toastService.add({ severity: 'success', summary: 'Categoria atualizada' });
      } else {
        await this.store.createCategory({
          name: this.categoryForm.name.trim(),
          type: this.categoryForm.type,
          color: this.categoryForm.color,
          icon: this.categoryForm.icon,
        });
        this.toastService.add({ severity: 'success', summary: 'Categoria criada' });
      }
      this.categoryDialogVisible = false;
    } finally {
      this.saving.set(false);
    }
  }

  async toggleCategory(cat: Category): Promise<void> {
    await this.store.toggleCategoryStatus(cat.id, !cat.active);
    this.toastService.add({
      severity: 'info',
      summary: cat.active ? 'Categoria desativada' : 'Categoria reativada',
    });
  }

  confirmDeleteCategory(cat: Category): void {
    this.confirmService.confirm({
      header: 'Excluir Categoria',
      message: `Deseja excluir fisicamente a categoria "${cat.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      variant: 'destructive',
      accept: () => {
        void this.store.deleteCategory(cat.id).then(() => {
          this.toastService.add({ severity: 'success', summary: 'Categoria excluída' });
        });
      },
    });
  }

  openBeneficiaryDialog(ben?: Beneficiary): void {
    if (ben) {
      this.editingBeneficiaryId.set(ben.id);
      this.beneficiaryName = ben.name;
    } else {
      this.editingBeneficiaryId.set(null);
      this.beneficiaryName = '';
    }
    this.beneficiaryDialogVisible = true;
  }

  async saveBeneficiary(): Promise<void> {
    if (!this.beneficiaryName.trim()) return;
    this.saving.set(true);
    try {
      const id = this.editingBeneficiaryId();
      if (id) {
        await this.store.updateBeneficiary(id, this.beneficiaryName.trim());
        this.toastService.add({ severity: 'success', summary: 'Beneficiário atualizado' });
      } else {
        await this.store.createBeneficiary(this.beneficiaryName.trim());
        this.toastService.add({ severity: 'success', summary: 'Beneficiário criado' });
      }
      this.beneficiaryDialogVisible = false;
    } finally {
      this.saving.set(false);
    }
  }

  async toggleBeneficiary(ben: Beneficiary): Promise<void> {
    await this.store.toggleBeneficiaryStatus(ben.id, !ben.active);
    this.toastService.add({
      severity: 'info',
      summary: ben.active ? 'Beneficiário desativado' : 'Beneficiário reativado',
    });
  }

  confirmDeleteBeneficiary(ben: Beneficiary): void {
    this.confirmService.confirm({
      header: 'Excluir Beneficiário',
      message: `Deseja excluir fisicamente o beneficiário "${ben.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      variant: 'destructive',
      accept: () => {
        void this.store.deleteBeneficiary(ben.id).then(() => {
          this.toastService.add({ severity: 'success', summary: 'Beneficiário excluído' });
        });
      },
    });
  }
}
