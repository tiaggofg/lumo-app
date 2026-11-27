import { TestBed } from '@angular/core/testing';
import { LumoLogoComponent } from './lumo-logo.component';

describe('LumoLogoComponent', () => {
  it('should render full variant with Prisma de Luz SVG emblem, Lumo wordmark and subtitle', () => {
    const fixture = TestBed.createComponent(LumoLogoComponent);
    fixture.componentRef.setInput('variant', 'full');
    fixture.componentRef.setInput('subtitle', 'Controle Financeiro');
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const svg = host.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(host.innerHTML).toContain('#4F46E5');
    expect(host.innerHTML).toContain('#0284C7');

    const wordmark = host.querySelector('[data-testid="lumo-logo-wordmark"]');
    expect(wordmark?.textContent?.trim()).toBe('Lumo');

    const subtitle = host.querySelector('[data-testid="lumo-logo-subtitle"]');
    expect(subtitle?.textContent?.trim()).toBe('Controle Financeiro');
  });

  it('should render mark variant with only the compact SVG emblem and no wordmark', () => {
    const fixture = TestBed.createComponent(LumoLogoComponent);
    fixture.componentRef.setInput('variant', 'mark');
    fixture.componentRef.setInput('subtitle', 'Controle Financeiro');
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('svg')).toBeTruthy();
    expect(host.querySelector('[data-testid="lumo-logo-wordmark"]')).toBeNull();
    expect(host.querySelector('[data-testid="lumo-logo-subtitle"]')).toBeNull();
  });

  it('should support size and adaptive tone classes', () => {
    const fixture = TestBed.createComponent(LumoLogoComponent);
    fixture.componentRef.setInput('size', 'sm');
    fixture.componentRef.setInput('tone', 'adaptive');
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const svg = host.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('w-8');
    expect(svg?.getAttribute('class')).toContain('h-8');

    const wordmark = host.querySelector('[data-testid="lumo-logo-wordmark"]');
    expect(wordmark?.className).toContain('text-slate-900');
  });
});
