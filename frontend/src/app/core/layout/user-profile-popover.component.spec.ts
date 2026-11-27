import { TestBed } from '@angular/core/testing';
import { AuthUser } from '../auth/auth.models';
import { UserProfilePopoverComponent } from './user-profile-popover.component';

describe('UserProfilePopoverComponent', () => {
  const defaultUser: AuthUser = {
    id: 'u-1',
    name: 'Tiago Fernandes Godoy',
    email: 'tiago.fernandes.godoy@gmail.com',
    avatarUrl: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserProfilePopoverComponent],
    });
  });

  it('should render initial badge, user name, email, and Sair button without excluded items', () => {
    const fixture = TestBed.createComponent(UserProfilePopoverComponent);
    fixture.componentRef.setInput('user', defaultUser);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const popover = host.querySelector('[data-testid="user-profile-popover"]');
    expect(popover).toBeTruthy();
    expect(popover?.className).toContain('z-50');
    expect(popover?.className).toContain('bg-white');
    expect(popover?.className).toContain('dark:bg-slate-950');

    expect(host.querySelector('[data-testid="profile-popover-initial"]')?.textContent?.trim()).toBe(
      'T'
    );
    expect(host.querySelector('[data-testid="profile-popover-name"]')?.textContent?.trim()).toBe(
      'Tiago Fernandes Godoy'
    );
    expect(host.querySelector('[data-testid="profile-popover-email"]')?.textContent?.trim()).toBe(
      'tiago.fernandes.godoy@gmail.com'
    );

    const logoutBtn = host.querySelector('[data-testid="profile-popover-logout"]');
    expect(logoutBtn?.textContent?.trim()).toBe('Sair');
    expect(logoutBtn?.querySelector('.pi-sign-out')).toBeTruthy();

    const fullText = host.textContent ?? '';
    expect(fullText).not.toContain('My profile');
    expect(fullText).not.toContain('Create team');
    expect(fullText).not.toContain('✓');
    expect(host.querySelector('.pi-check')).toBeNull();
  });

  it('should apply truncation classes to long user name and email', () => {
    const fixture = TestBed.createComponent(UserProfilePopoverComponent);
    fixture.componentRef.setInput('user', {
      id: 'u-2',
      name: 'Nome Muito Longo De Usuario Para Testar Truncamento No Popover',
      email: 'email.muito.extenso.para.testar.truncamento@dominio-financeiro-lumo.com.br',
      avatarUrl: null,
    });
    fixture.detectChanges();

    const nameEl = fixture.nativeElement.querySelector('[data-testid="profile-popover-name"]');
    const emailEl = fixture.nativeElement.querySelector('[data-testid="profile-popover-email"]');
    expect(nameEl?.className).toContain('truncate');
    expect(emailEl?.className).toContain('truncate');
  });

  it('should emit closed when Escape key is pressed', () => {
    const fixture = TestBed.createComponent(UserProfilePopoverComponent);
    fixture.componentRef.setInput('user', defaultUser);
    fixture.detectChanges();

    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit closed on outside click and stay open on inside click', () => {
    const fixture = TestBed.createComponent(UserProfilePopoverComponent);
    fixture.componentRef.setInput('user', defaultUser);
    fixture.detectChanges();

    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    const insideEl = fixture.nativeElement.querySelector(
      '[data-testid="profile-popover-name"]'
    ) as HTMLElement;
    insideEl.click();
    expect(closedSpy).not.toHaveBeenCalled();

    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    outsideEl.click();
    expect(closedSpy).toHaveBeenCalledTimes(1);
    outsideEl.remove();
  });

  it('should emit logout when Sair button is clicked', () => {
    const fixture = TestBed.createComponent(UserProfilePopoverComponent);
    fixture.componentRef.setInput('user', defaultUser);
    fixture.detectChanges();

    const logoutSpy = vi.fn();
    fixture.componentInstance.logout.subscribe(logoutSpy);

    const logoutBtn = fixture.nativeElement.querySelector(
      '[data-testid="profile-popover-logout"]'
    ) as HTMLButtonElement;
    logoutBtn.click();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('should support right placement when sidebar is collapsed', () => {
    const fixture = TestBed.createComponent(UserProfilePopoverComponent);
    fixture.componentRef.setInput('user', defaultUser);
    fixture.componentRef.setInput('position', 'right');
    fixture.detectChanges();

    const popover = fixture.nativeElement.querySelector('[data-testid="user-profile-popover"]');
    expect(popover?.className).toContain('left-full');
    expect(popover?.className).toContain('ml-3');
  });
});
