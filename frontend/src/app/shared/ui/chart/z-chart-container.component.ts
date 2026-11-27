import { Component, input, output } from '@angular/core';
import { ZBadgeComponent, ZBadgeVariant } from '../badge/z-badge.component';

export interface ZChartLegendItem {
  key: string;
  label: string;
  color: string;
  valueText?: string;
  active?: boolean;
}

@Component({
  selector: 'z-chart-container',
  standalone: true,
  imports: [ZBadgeComponent],
  host: {
    class: 'block h-full',
  },
  template: `
    <section
      class="h-full flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 shadow-sm"
      data-testid="z-chart-container"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-0.5">
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">
            {{ title() }}
          </h2>
          @if (description()) {
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ description() }}
            </p>
          }
        </div>

        @if (badgeText()) {
          <z-badge [label]="badgeText()" [variant]="badgeVariant()" />
        }
      </div>

      @if (legendItems().length > 0) {
        <div
          class="flex flex-wrap items-center gap-2 pt-0.5"
          role="group"
          aria-label="Séries do gráfico"
          data-testid="z-chart-legend"
        >
          @for (item of legendItems(); track item.key) {
            <button
              type="button"
              (click)="legendToggle.emit(item.key)"
              [attr.data-testid]="'z-chart-legend-item-' + item.key"
              [attr.aria-pressed]="item.active !== false"
              [class.opacity-45]="item.active === false"
              [class.line-through]="item.active === false"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer select-none"
            >
              <span
                class="w-2.5 h-2.5 rounded-xs shrink-0"
                [style.background-color]="item.color"
              ></span>
              <span>{{ item.label }}</span>
              @if (item.valueText) {
                <span class="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {{ item.valueText }}
                </span>
              }
            </button>
          }
        </div>
      }

      <div class="w-full flex-1 flex flex-col justify-center">
        <ng-content />
      </div>
    </section>
  `,
})
export class ZChartContainerComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly badgeText = input<string>('');
  readonly badgeVariant = input<ZBadgeVariant>('default');
  readonly legendItems = input<readonly ZChartLegendItem[]>([]);

  readonly legendToggle = output<string>();
}
