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

  test('dashboard default route and navigation, dashboard and typography scale', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-empty-state')).toBeVisible();

    // Verify 100% absence of PrimeNG license banner
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Invalid PrimeUI License');

    // Verify Lumo SVG brand assets (/favicon.svg & /site.webmanifest)
    const favRes = await page.request.get('/favicon.svg');
    expect(favRes.ok()).toBe(true);
    expect(await favRes.text()).toContain('#4F46E5');

    const manifestRes = await page.request.get('/site.webmanifest');
    expect(manifestRes.ok()).toBe(true);
    expect(await manifestRes.text()).toContain('Lumo');

    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    if (isDesktop) {
      await expect(page.getByTestId('desktop-sidebar').getByTestId('lumo-logo')).toBeVisible();
    } else {
      await expect(page.locator('header').getByTestId('lumo-logo')).toBeVisible();
    }

    const mainClass = await page.locator('main').getAttribute('class');
    expect(mainClass).toContain('w-full');
    expect(mainClass).not.toContain('max-w-7xl');

    const bodyStyle = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body);
      return {
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(bodyStyle.fontSize).toBe('16px');
    expect(bodyStyle.fontFamily).toContain('Plus Jakarta Sans');
    // Light mode canvas is slate-100 (#F1F5F9 -> rgb(241, 245, 249))
    expect(bodyStyle.backgroundColor).toBe('rgb(241, 245, 249)');

    if (isDesktop) {
      const sidebar = page.getByTestId('desktop-sidebar');
      await expect(sidebar).toBeVisible();

      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox?.height).toBe(900);
      expect(sidebarBox?.width).toBe(272);

      const sidebarClass = await sidebar.getAttribute('class');
      expect(sidebarClass).toContain('bg-slate-900');
      expect(sidebarClass).toContain('h-dvh');
      expect(sidebarClass).toContain('sticky');

      // Collapse sidebar to icon-only rail (w-20 / 80px)
      await page.getByTestId('sidebar-collapse-toggle').click();
      await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
      await expect
        .poll(async () => (await sidebar.boundingBox())?.width)
        .toBe(80);

      // Reload and confirm collapsed state persists from localStorage
      await page.reload();
      await expect(page.getByTestId('desktop-sidebar')).toHaveAttribute('data-collapsed', 'true');

      // Expand sidebar back to w-68 (272px)
      await page.getByTestId('sidebar-collapse-toggle').click();
      await expect(page.getByTestId('desktop-sidebar')).toHaveAttribute('data-collapsed', 'false');
    }

    const bodyHtml = await page.locator('body').innerHTML();
    expect(bodyHtml).not.toContain('emerald-');

    await page.getByTestId('dashboard-empty-create-btn').click();
    await expect(page).toHaveURL(/\/budgets$/);
  });

  test('budgets list and create flow', async ({ page }) => {
    await page.goto('/budgets');
    await expect(page.getByTestId('budgets-empty-state')).toBeVisible();
    expect(await page.locator('body').innerText()).not.toContain('Invalid PrimeUI License');

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
    expect(await page.locator('body').innerText()).not.toContain('Invalid PrimeUI License');

    await page.getByTestId('new-category-btn').click();
    await page.locator('#cat-name').fill(catName);
    await page.getByTestId('save-category-btn').click();
    await expect(page.getByText(catName)).toBeVisible();

    await page.getByTestId('tab-beneficiaries').click();
    await expect(page.getByText('Família', { exact: true })).toBeVisible();

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
    expect(await page.locator('body').innerText()).not.toContain('Invalid PrimeUI License');

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
    expect(await page.locator('body').innerText()).not.toContain('Invalid PrimeUI License');

    // Charts must NOT be embedded in /budgets/:id; shortcut to /dashboard must be visible
    await expect(page.getByTestId('budget-charts')).toHaveCount(0);
    await expect(page.getByTestId('open-dashboard-charts-btn')).toBeVisible();

    // 1-click settle on Aluguel E2E (works on both desktop table & mobile card)
    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    if (isDesktop) {
      const statusHeader = page.getByTestId('status-column-header');
      await expect(statusHeader).toBeVisible();
      await expect(statusHeader).toHaveText('Status');
      await expect(statusHeader).toHaveAttribute(
        'data-tooltip',
        /Clique no status de qualquer lançamento para alternar/
      );

      const toggleBtn = page.getByTestId('toggle-status-Aluguel E2E');
      await expect(toggleBtn).toHaveAttribute('data-tooltip', 'Clique para marcar como Pago');
      await toggleBtn.click();
    } else {
      await page
        .getByTestId('transactions-mobile-cards')
        .locator('div', { hasText: 'Aluguel E2E' })
        .getByRole('button', { name: /Pendente/i })
        .first()
        .click();
    }

    await expect(page.getByTestId('summary-realized-expense')).toContainText('800,00');
    if (isDesktop) {
      await expect(page.getByTestId('toggle-status-Aluguel E2E')).toHaveAttribute(
        'data-tooltip',
        'Clique para reverter para Pendente'
      );
    }

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

  test('dashboard multi-color charts and dark mode persistence', async ({ page, request }) => {
    const octBudgetRes = await request.post(`${API_BASE}/budgets`, {
      data: { competenceMonth: '2026-10' },
    });
    const octBudget: { id: string } = await octBudgetRes.json();

    await request.post(`${API_BASE}/budgets/${octBudget.id}/transactions`, {
      data: {
        type: 'INCOME',
        description: 'Salário Outubro',
        amount: 6000.0,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000010',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    const budgetRes = await request.post(`${API_BASE}/budgets`, {
      data: { competenceMonth: '2026-11' },
    });
    const budget: { id: string } = await budgetRes.json();

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'INCOME',
        description: 'Salário Novembro',
        amount: 7000.0,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000010',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Aluguel Chart',
        amount: 1200.0,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000001',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Energia Chart',
        amount: 400.0,
        status: 'ESTIMATED',
        categoryId: '10000000-0000-0000-0000-000000000002',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-kpi-cards')).toBeVisible();
    await expect(page.getByTestId('z-chart-container')).toHaveCount(4);
    await expect(page.getByTestId('chart-category')).toBeVisible();
    await expect(page.getByTestId('chart-category-center')).toContainText('1.600,00');
    await expect(page.getByTestId('chart-beneficiary')).toBeVisible();
    await expect(page.getByTestId('chart-status')).toBeVisible();
    await expect(page.getByTestId('chart-status-center')).toContainText('75%');
    await expect(page.getByTestId('chart-evolution')).toBeVisible();
    await expect(page.getByTestId('category-breakdown-list')).toContainText('75%');
    await expect(page.getByTestId('category-breakdown-list')).toContainText('25%');

    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    if (isDesktop) {
      // Verify all 4 KPI cards on the row share the exact same height
      const kpiCards = page.getByTestId('dashboard-kpi-cards').locator('> div');
      const kpi0 = await kpiCards.nth(0).boundingBox();
      const kpi3 = await kpiCards.nth(3).boundingBox();
      expect(kpi0?.height).toBeGreaterThan(0);
      expect(Math.abs((kpi0?.height ?? 0) - (kpi3?.height ?? 0))).toBeLessThanOrEqual(1);

      // Verify left and right chart cards in each row share the exact same height
      const chartCards = page.getByTestId('z-chart-container');
      const chart0 = await chartCards.nth(0).boundingBox();
      const chart1 = await chartCards.nth(1).boundingBox();
      const chart2 = await chartCards.nth(2).boundingBox();
      const chart3 = await chartCards.nth(3).boundingBox();
      expect(Math.abs((chart0?.height ?? 0) - (chart1?.height ?? 0))).toBeLessThanOrEqual(1);
      expect(Math.abs((chart2?.height ?? 0) - (chart3?.height ?? 0))).toBeLessThanOrEqual(1);
    }

    // Interactive legend pill click in ZardUI chart container
    const incomeLegendBtn = page.getByTestId('z-chart-legend-item-income');
    await expect(incomeLegendBtn).toHaveAttribute('aria-pressed', 'true');
    await incomeLegendBtn.click();
    await expect(incomeLegendBtn).toHaveAttribute('aria-pressed', 'false');

    const toggleBtn = page.getByTestId(isDesktop ? 'theme-toggle-desktop' : 'theme-toggle-mobile');
    await toggleBtn.click();

    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByTestId('chart-category')).toBeVisible();
    await expect(page.getByTestId('chart-evolution')).toBeVisible();
  });
});
