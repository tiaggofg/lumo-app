import { Pipe, PipeTransform } from '@angular/core';

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

@Pipe({
  name: 'competenceMonth',
  standalone: true,
})
export class CompetenceMonthPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) {
      return value ?? '';
    }
    const [year, monthStr] = value.split('-');
    const monthIndex = Number(monthStr) - 1;
    const monthName = MONTHS_PT[monthIndex] ?? monthStr;
    return `${monthName} ${year}`;
  }
}
