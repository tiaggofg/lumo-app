import { BrlCurrencyPipe } from './brl-currency.pipe';
import { CompetenceMonthPipe } from './competence-month.pipe';

describe('BrlCurrencyPipe & CompetenceMonthPipe', () => {
  const brlPipe = new BrlCurrencyPipe();
  const monthPipe = new CompetenceMonthPipe();

  it('should format positive BRL currency values', () => {
    expect(brlPipe.transform(6178.42).replace(/\s/g, ' ')).toBe('R$ 6.178,42');
  });

  it('should format zero and null values as R$ 0,00', () => {
    expect(brlPipe.transform(0).replace(/\s/g, ' ')).toBe('R$ 0,00');
    expect(brlPipe.transform(null).replace(/\s/g, ' ')).toBe('R$ 0,00');
  });

  it('should format negative BRL currency values', () => {
    expect(brlPipe.transform(-150.5).replace(/\s/g, ' ')).toBe('-R$ 150,50');
  });

  it('should format YYYY-MM into Portuguese month and year', () => {
    expect(monthPipe.transform('2026-11')).toBe('Novembro 2026');
    expect(monthPipe.transform('2027-02')).toBe('Fevereiro 2027');
  });
});
