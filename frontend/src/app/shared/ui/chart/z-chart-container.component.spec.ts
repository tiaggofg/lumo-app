import { TestBed } from '@angular/core/testing';
import { ZChartContainerComponent, ZChartLegendItem } from './z-chart-container.component';

describe('ZChartContainerComponent', () => {
  it('should render elevated card surface, title, description, badge counter and interactive legend pills', () => {
    const fixture = TestBed.createComponent(ZChartContainerComponent);
    const items: ZChartLegendItem[] = [
      { key: 'income', label: 'Receitas', color: '#0284C7', valueText: 'R$ 10.000,00', active: true },
      { key: 'expense', label: 'Despesas', color: '#E11D48', active: false },
    ];
    fixture.componentRef.setInput('title', 'Evolução Mensal');
    fixture.componentRef.setInput('description', 'Comparativo cronológico');
    fixture.componentRef.setInput('badgeText', '3 meses');
    fixture.componentRef.setInput('badgeVariant', 'sky');
    fixture.componentRef.setInput('legendItems', items);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const section = host.querySelector('[data-testid="z-chart-container"]');
    expect(section?.className).toContain('shadow-sm');
    expect(host.textContent).toContain('Evolução Mensal');
    expect(host.textContent).toContain('Comparativo cronológico');
    expect(host.textContent).toContain('3 meses');

    const toggled: string[] = [];
    fixture.componentInstance.legendToggle.subscribe((k) => toggled.push(k));

    const incomeBtn: HTMLButtonElement | null = host.querySelector(
      '[data-testid="z-chart-legend-item-income"]'
    );
    const expenseBtn: HTMLButtonElement | null = host.querySelector(
      '[data-testid="z-chart-legend-item-expense"]'
    );
    expect(incomeBtn).toBeTruthy();
    expect(expenseBtn?.className).toContain('opacity-45');

    incomeBtn?.click();
    expect(toggled).toEqual(['income']);
  });

  it('should hide description, badge, and legend bar when optional inputs are omitted', () => {
    const fixture = TestBed.createComponent(ZChartContainerComponent);
    fixture.componentRef.setInput('title', 'Despesas por Categoria');
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('Despesas por Categoria');
    expect(host.querySelector('[data-testid="z-chart-legend"]')).toBeNull();
  });

  it('should set aria-pressed to false on inactive legend items and true on active items', () => {
    const fixture = TestBed.createComponent(ZChartContainerComponent);
    fixture.componentRef.setInput('title', 'Status');
    fixture.componentRef.setInput('legendItems', [
      { key: 'settled', label: 'Liquidado', color: '#0284C7', active: true },
      { key: 'pending', label: 'Pendente', color: '#4F46E5', active: false },
    ]);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const settledBtn = host.querySelector('[data-testid="z-chart-legend-item-settled"]');
    const pendingBtn = host.querySelector('[data-testid="z-chart-legend-item-pending"]');
    expect(settledBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(pendingBtn?.getAttribute('aria-pressed')).toBe('false');
  });
});
