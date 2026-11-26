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

    expect(fixture.nativeElement.textContent).toContain('Orçamentos');
    expect(fixture.nativeElement.textContent).toContain('Recorrências');
    expect(fixture.nativeElement.textContent).toContain('Cadastros');

    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
    fixture.componentInstance.mobileMenuOpen.set(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(true);
  });
});
