import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), ConfirmationService, MessageService],
    });
  });

  it('should render navigation links and toggle mobile menu', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const navRoutes = fixture.componentInstance.navItems.map((i) => i.route);
    expect(navRoutes).toEqual(['/dashboard', '/budgets', '/recurrences', '/catalog']);

    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Orçamentos');
    expect(fixture.nativeElement.textContent).toContain('Recorrências');
    expect(fixture.nativeElement.textContent).toContain('Cadastros');

    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
    fixture.componentInstance.mobileMenuOpen.set(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(true);
  });

  it('should render fluid full-width main container and Royal Indigo brand classes without emerald', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentInstance.mobileMenuOpen.set(true);
    fixture.detectChanges();

    const mainEl: HTMLElement = fixture.nativeElement.querySelector('main');
    expect(mainEl).toBeTruthy();
    expect(mainEl.className).toContain('w-full');
    expect(mainEl.className).not.toContain('max-w-7xl');

    const html: string = fixture.nativeElement.innerHTML;
    expect(html).toContain('indigo-600');
    expect(html).not.toContain('emerald-');
  });
});
