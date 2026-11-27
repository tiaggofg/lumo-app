import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZBadgeComponent } from '../badge/z-badge.component';
import { ZTooltipDirective } from '../tooltip/z-tooltip.directive';
import { ZButtonComponent } from './z-button.component';

@Component({
  standalone: true,
  imports: [ZTooltipDirective],
  template: `
    <button
      type="button"
      data-testid="tip-host"
      [zTooltip]="tipText"
      [tooltipPosition]="pos"
    >
      Hover me
    </button>
  `,
})
class TooltipHostComponent {
  tipText = 'Alternar status';
  pos: 'top' | 'bottom' | 'left' | 'right' = 'right';
}

describe('ZButtonComponent, ZBadgeComponent & ZTooltipDirective', () => {
  it('should render z-button variants, loading spinner and emit buttonClick', () => {
    const fixture = TestBed.createComponent(ZButtonComponent);
    fixture.componentRef.setInput('label', 'Salvar');
    fixture.componentRef.setInput('icon', 'pi pi-check');
    fixture.componentRef.setInput('variant', 'default');
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.textContent).toContain('Salvar');
    expect(btn.className).toContain('bg-indigo-600');

    const clicks: MouseEvent[] = [];
    fixture.componentInstance.buttonClick.subscribe((e) => clicks.push(e));
    btn.click();
    expect(clicks).toHaveLength(1);

    // Loading state disables button and shows spinner
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.pi-spinner')).toBeTruthy();
  });

  it('should prevent click emission when z-button is disabled', () => {
    const fixture = TestBed.createComponent(ZButtonComponent);
    fixture.componentRef.setInput('label', 'Excluir');
    fixture.componentRef.setInput('variant', 'destructive');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const clicks: MouseEvent[] = [];
    fixture.componentInstance.buttonClick.subscribe((e) => clicks.push(e));
    fixture.componentInstance.handleClick(new MouseEvent('click'));
    expect(clicks).toHaveLength(0);
  });

  it('should render z-badge semantic financial variants', () => {
    const fixture = TestBed.createComponent(ZBadgeComponent);
    fixture.componentRef.setInput('label', '3 categorias');
    fixture.componentRef.setInput('variant', 'sky');
    fixture.componentRef.setInput('icon', 'pi pi-tag');
    fixture.detectChanges();

    const span: HTMLElement = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toContain('3 categorias');
    expect(span.className).toContain('bg-sky-100');
  });

  it('should synchronize data-tooltip attribute and show/hide ZardUI tooltip popover on hover', () => {
    const fixture = TestBed.createComponent(TooltipHostComponent);
    fixture.detectChanges();

    const btn: HTMLElement = fixture.nativeElement.querySelector('[data-testid="tip-host"]');
    expect(btn.getAttribute('data-tooltip')).toBe('Alternar status');

    btn.dispatchEvent(new MouseEvent('mouseenter'));
    const popover = document.body.querySelector('[data-testid="z-tooltip-popover"]');
    expect(popover).toBeTruthy();
    expect(popover?.textContent).toBe('Alternar status');

    btn.dispatchEvent(new MouseEvent('mouseleave'));
    expect(document.body.querySelector('[data-testid="z-tooltip-popover"]')).toBeNull();
  });
});
