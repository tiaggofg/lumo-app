import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../../core/services/theme.service';
import { BudgetChartsComponent } from './budget-charts.component';

describe('BudgetChartsComponent', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      measureText: vi.fn(() => ({ width: 20 })),
      fillText: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      quadraticCurveTo: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D);
  });

  it('should render both category and beneficiary canvases and react to theme toggle', () => {
    TestBed.configureTestingModule({ imports: [BudgetChartsComponent] });
    const fixture = TestBed.createComponent(BudgetChartsComponent);
    const themeService = TestBed.inject(ThemeService);

    fixture.componentRef.setInput('byCategory', [
      { id: 'c1', name: 'Moradia', color: '#6366F1', plannedAmount: 800, realizedAmount: 800, count: 1 },
      { id: null, name: 'Sem categoria', color: null, plannedAmount: 100, realizedAmount: 0, count: 1 },
    ]);
    fixture.componentRef.setInput('byBeneficiary', [
      { id: 'b1', name: 'Família', color: null, plannedAmount: 900, realizedAmount: 800, count: 2 },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="chart-category"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="chart-beneficiary"]')).toBeTruthy();

    themeService.toggle();
    fixture.detectChanges();
    fixture.destroy();
  });
});
