import { Directive } from '@angular/core';

@Directive({
  selector: 'input[zInput]',
  standalone: true,
  host: {
    class:
      'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 px-3.5 py-2.5 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all',
  },
})
export class ZInputDirective {}

@Directive({
  selector: 'textarea[zTextarea]',
  standalone: true,
  host: {
    class:
      'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 px-3.5 py-2.5 text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all',
  },
})
export class ZTextareaDirective {}
