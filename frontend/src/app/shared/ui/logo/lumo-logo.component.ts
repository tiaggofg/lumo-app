import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-lumo-logo',
  standalone: true,
  template: `
    <div
      class="inline-flex items-center select-none"
      [class]="variant() === 'mark' ? 'justify-center' : 'gap-3'"
      [attr.data-variant]="variant()"
      data-testid="lumo-logo"
    >
      <svg
        [class]="iconSizeClass()"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Lumo Prisma de Luz"
      >
        <defs>
          <linearGradient [attr.id]="gradBgId" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#4F46E5" />
            <stop offset="55%" stop-color="#3B82F6" />
            <stop offset="100%" stop-color="#0284C7" />
          </linearGradient>
          <linearGradient [attr.id]="gradBeamId" x1="20" y1="6" x2="20" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="100%" stop-color="#BAE6FD" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" [attr.fill]="'url(#' + gradBgId + ')'" />
        <path
          d="M9 27.5L20 33.5L31 27.5L27.2 24.8L20 28.8L12.8 24.8L9 27.5Z"
          fill="#BAE6FD"
          fill-opacity="0.38"
        />
        <path
          d="M11 22L20 27.5L29 22L25.5 19.6L20 22.9L14.5 19.6L11 22Z"
          fill="#E0F2FE"
          fill-opacity="0.62"
        />
        <path
          d="M20 6.5L28.5 16.5L20 22.2L11.5 16.5L20 6.5Z"
          [attr.fill]="'url(#' + gradBeamId + ')'"
        />
        <path
          d="M20 6.5L28.5 16.5L20 22.2V6.5Z"
          fill="#FFFFFF"
          fill-opacity="0.32"
        />
      </svg>

      @if (variant() === 'full') {
        <div class="leading-tight">
          <div class="flex items-center gap-1">
            <span
              class="font-extrabold tracking-tight"
              [class]="wordmarkClass()"
              data-testid="lumo-logo-wordmark"
            >
              Lumo
            </span>
            <span class="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block"></span>
          </div>
          @if (subtitle(); as sub) {
            <p
              class="text-xs font-medium leading-none mt-0.5"
              [class]="subtitleClass()"
              data-testid="lumo-logo-subtitle"
            >
              {{ sub }}
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class LumoLogoComponent {
  private static nextId = 0;
  private readonly instanceId = ++LumoLogoComponent.nextId;

  readonly gradBgId = `lumo-bg-grad-${this.instanceId}`;
  readonly gradBeamId = `lumo-beam-grad-${this.instanceId}`;

  readonly variant = input<'full' | 'mark'>('full');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly subtitle = input<string | null>(null);
  readonly tone = input<'dark-surface' | 'adaptive'>('dark-surface');

  readonly iconSizeClass = computed(() => {
    const s = this.size();
    if (s === 'sm') return 'w-8 h-8 shrink-0 shadow-xs rounded-[10px]';
    if (s === 'lg') return 'w-11 h-11 shrink-0 shadow-sm rounded-xl';
    return 'w-9 h-9 shrink-0 shadow-sm rounded-[11px]';
  });

  readonly wordmarkClass = computed(() => {
    const sizeCls = this.size() === 'sm' ? 'text-lg' : this.size() === 'lg' ? 'text-2xl' : 'text-xl';
    const colorCls =
      this.tone() === 'dark-surface'
        ? 'text-white'
        : 'text-slate-900 dark:text-white';
    return `${sizeCls} ${colorCls}`;
  });

  readonly subtitleClass = computed(() =>
    this.tone() === 'dark-surface'
      ? 'text-slate-400'
      : 'text-slate-500 dark:text-slate-400'
  );
}
