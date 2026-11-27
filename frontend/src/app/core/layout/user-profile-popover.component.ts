import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { AuthUser } from '../auth/auth.models';

export type ProfilePopoverPosition = 'above' | 'right';

@Component({
  selector: 'app-user-profile-popover',
  standalone: true,
  template: `
    <div
      data-testid="user-profile-popover"
      role="dialog"
      aria-label="Menu da conta"
      [class]="containerClasses()"
    >
      <!-- Header: Rounded square initial badge + user name -->
      <div class="flex items-center gap-3 px-3.5 py-3 min-w-0">
        <span
          data-testid="profile-popover-initial"
          aria-hidden="true"
          class="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/90 to-slate-700 text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-xs"
        >
          {{ userInitial() }}
        </span>
        <p
          data-testid="profile-popover-name"
          class="min-w-0 flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate"
          [title]="user().name"
        >
          {{ user().name }}
        </p>
      </div>

      <!-- Divider -->
      <div class="border-t border-slate-200 dark:border-slate-800"></div>

      <!-- Account email & logout action -->
      <div class="p-2 space-y-1">
        <p
          data-testid="profile-popover-email"
          class="px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400 truncate"
          [title]="user().email"
        >
          {{ user().email }}
        </p>

        <button
          type="button"
          data-testid="profile-popover-logout"
          (click)="logout.emit()"
          class="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-rose-600 dark:hover:text-rose-300 transition-colors cursor-pointer"
        >
          <i class="pi pi-sign-out text-sm shrink-0" aria-hidden="true"></i>
          <span>Sair</span>
        </button>
      </div>
    </div>
  `,
})
export class UserProfilePopoverComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly user = input.required<AuthUser>();
  readonly position = input<ProfilePopoverPosition>('above');

  readonly logout = output<void>();
  readonly closed = output<void>();

  readonly userInitial = computed(() => {
    const current = this.user();
    const source = (current.name || current.email || '').trim();
    return source ? source.charAt(0).toUpperCase() : '?';
  });

  readonly containerClasses = computed(() => {
    const base =
      'absolute z-50 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl ring-1 ring-slate-950/5 dark:ring-white/5';
    const placement =
      this.position() === 'right' ? 'bottom-0 left-full ml-3' : 'bottom-full left-0 mb-2.5';
    return `${base} ${placement}`;
  });

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closed.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }
    if (
      this.elementRef.nativeElement.contains(target) ||
      target.closest('[data-profile-popover-trigger]') ||
      target.closest('[data-testid^="theme-toggle-"]')
    ) {
      return;
    }
    this.closed.emit();
  }
}
