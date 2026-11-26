import { expect, test } from '@playwright/test';

const API_BASE = process.env['LUMO_API_URL'] || 'http://localhost:8080/api/v1';

async function resetTestData(request: import('@playwright/test').APIRequestContext): Promise<void> {
  // Clean up any budgets, transactions, and recurrences created by previous test runs
  const budgetsRes = await request.get(`${API_BASE}/budgets`);
  if (budgetsRes.ok()) {
    const budgets: { id: string }[] = await budgetsRes.json();
    for (const b of budgets) {
      const txnsRes = await request.get(`${API_BASE}/budgets/${b.id}/transactions`);
      if (txnsRes.ok()) {
        const txns: { id: string }[] = await txnsRes.json();
        for (const t of txns) {
          await request.delete(`${API_BASE}/transactions/${t.id}`);
        }
      }
      await request.delete(`${API_BASE}/budgets/${b.id}`);
    }
  }

  const recRes = await request.get(`${API_BASE}/recurring-transactions`);
  if (recRes.ok()) {
    const recs: { id: string; active: boolean; hasGeneratedTransactions: boolean }[] =
      await recRes.json();
    for (const r of recs) {
      if (!r.hasGeneratedTransactions) {
        await request.delete(`${API_BASE}/recurring-transactions/${r.id}`);
      } else if (r.active) {
        await request.patch(`${API_BASE}/recurring-transactions/${r.id}/deactivate`, {
          data: { removeFutureOpenTransactions: true },
        });
      }
    }
  }
}

test.describe('Lumo MVP Full-Stack E2E', () => {
  let consoleErrors: string[] = [];
  let pageErrors: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    consoleErrors = [];
    pageErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    await resetTestData(request);
  });

  test.afterEach(() => {
    expect(pageErrors, 'Zero uncaught page errors').toEqual([]);
    expect(consoleErrors, 'Zero console errors').toEqual([]);
  });

  test('budgets list and create flow', async ({ page }) => {
    await page.goto('/budgets');
    await expect(page.getByTestId('budgets-empty-state')).toBeVisible();

    await page.getByTestId('empty-create-budget-btn').click();
    await page.getByTestId('competence-month-input').fill('2026-11');
    await page.getByTestId('confirm-create-budget-btn').click();

    await expect(page).toHaveURL(/\/budgets\/[0-9a-f-]+$/);
    await expect(page.getByTestId('budget-detail-title')).toContainText('Novembro 2026');
    await expect(page.getByTestId('summary-planned-balance')).toContainText('R$');
  });

  test('catalog categories and beneficiaries', async ({ page }) => {
    const suffix = Date.now().toString().slice(-5);
    const catName = `Pets E2E ${suffix}`;
    const benName = `Tiago E2E ${suffix}`;

    await page.goto('/catalog');
    await expect(page.getByText('Moradia')).toBeVisible();

    await page.getByTestId('new-category-btn').click();
    await page.locator('#cat-name').fill(catName);
    await page.getByTestId('save-category-btn').click();
    await expect(page.getByText(catName)).toBeVisible();

    await page.getByTestId('tab-beneficiaries').click();
    await expect(page.getByText('Família')).toBeVisible();

    await page.getByTestId('new-beneficiary-btn').click();
    await page.locator('#ben-name').fill(benName);
    await page.getByTestId('save-beneficiary-btn').click();
    await expect(page.getByText(benName)).toBeVisible();
  });

  test('recurrences lifecycle and automatic materialization', async ({ page, request }) => {
    const suffix = Date.now().toString().slice(-5);
    const aguaName = `Água E2E ${suffix}`;
    const aluguelName = `Aluguel E2E ${suffix}`;

    // Create an ESTIMATED recurrence via API + a FIXED recurrence via UI
    await request.post(`${API_BASE}/recurring-transactions`, {
      data: {
        type: 'EXPENSE',
        description: aguaName,
        amount: 180.0,
        amountType: 'ESTIMATED',
        recurrenceType: 'INDEFINITE',
        startMonth: '2026-10',
        dueDay: 20,
      },
    });

    await page.goto('/recurrences');
    await expect(page.getByTestId(`recurrence-card-${aguaName}`)).toBeVisible();

    await page.getByRole('button', { name: 'Nova Recorrência' }).click();
    await page.getByTestId('rec-description-input').fill(aluguelName);
    await page.locator('#rec-amount').click();
    await page.locator('#rec-amount').fill('800');
    await page.locator('#rec-start-month').fill('2026-10');
    await page.getByTestId('rec-save-btn').click();

    await expect(page.getByTestId(`recurrence-card-${aluguelName}`)).toBeVisible();

    // Create budget 2026-11 and verify both recurrences materialized automatically
    await page.goto('/budgets');
    await page.getByRole('button', { name: 'Novo Orçamento' }).click();
    await page.getByTestId('competence-month-input').fill('2026-11');
    await page.getByRole('button', { name: 'Criar Orçamento' }).click();

    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    const listContainer = page.getByTestId(
      isDesktop ? 'transactions-table' : 'transactions-mobile-cards'
    );
    await expect(listContainer.getByText(aguaName)).toBeVisible();
    await expect(listContainer.getByText(aluguelName)).toBeVisible();
  });

  test('budget detail settle and confirm estimate', async ({ page, request }) => {
    const budgetRes = await request.post(`${API_BASE}/budgets`, {
      data: { competenceMonth: '2026-11' },
    });
    const budget: { id: string } = await budgetRes.json();

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'INCOME',
        description: 'Salário E2E',
        amount: 6362.29,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000010',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Aluguel E2E',
        amount: 800.0,
        status: 'PENDING',
        dueDate: '2026-11-05',
        categoryId: '10000000-0000-0000-0000-000000000001',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Água E2E',
        amount: 180.0,
        status: 'ESTIMATED',
        dueDate: '2026-11-20',
        categoryId: '10000000-0000-0000-0000-000000000002',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await page.goto(`/budgets/${budget.id}`);
    await expect(page.getByTestId('summary-planned-income')).toContainText('6.362,29');
    await expect(page.getByTestId('summary-planned-expense')).toContainText('980,00');
    await expect(page.getByTestId('summary-realized-expense')).toContainText('0,00');

    // 1-click settle on Aluguel E2E (works on both desktop table & mobile card)
    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    if (isDesktop) {
      await page.getByTestId('toggle-status-Aluguel E2E').click();
    } else {
      await page
        .getByTestId('transactions-mobile-cards')
        .locator('div', { hasText: 'Aluguel E2E' })
        .getByRole('button', { name: /Pendente/i })
        .first()
        .click();
    }

    await expect(page.getByTestId('summary-realized-expense')).toContainText('800,00');

    // Confirm estimate on Água E2E
    if (isDesktop) {
      await page.getByTestId('confirm-estimate-btn-Água E2E').click();
    } else {
      await page
        .getByTestId('transactions-mobile-cards')
        .getByRole('button', { name: /Confirmar/i })
        .first()
        .click();
    }

    await page.locator('#estimate-amount').click();
    await page.locator('#estimate-amount').fill('195,64');
    await page.getByTestId('confirm-estimate-submit').click();

    await expect(page.getByTestId('summary-planned-expense')).toContainText('995,64');
  });

  test('charts and dark mode persistence', async ({ page, request }) => {
    const budgetRes = await request.post(`${API_BASE}/budgets`, {
      data: { competenceMonth: '2026-11' },
    });
    const budget: { id: string } = await budgetRes.json();

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Aluguel Chart',
        amount: 800.0,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000001',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await page.goto(`/budgets/${budget.id}`);
    await expect(page.getByTestId('budget-charts')).toBeVisible();
    await expect(page.getByTestId('chart-category')).toBeVisible();
    await expect(page.getByTestId('chart-beneficiary')).toBeVisible();

    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    const toggleBtn = page.getByTestId(isDesktop ? 'theme-toggle-desktop' : 'theme-toggle-mobile');
    await toggleBtn.click();

    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
