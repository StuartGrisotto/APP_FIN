import { ChartPoint, DashboardData, PeriodFilter, Transaction, User } from '../types/finance';

export const mockUser: User = {
  id: 'u_01',
  name: 'Grisotto',
  email: 'grisotto.work@gmail.com',
};

const buildSummary = (transactions: Transaction[]): DashboardData['summary'] => {
  const incomeTotal = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, item) => acc + item.amount, 0);

  const expenseTotal = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, item) => acc + item.amount, 0);

  return {
    incomeTotal,
    expenseTotal,
    balance: incomeTotal - expenseTotal,
    previousMonthBalance: 0,
  };
};

const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: PeriodFilter,
  referenceDate: Date,
): Transaction[] => {
  if (transactions.length === 0) {
    return transactions;
  }

  const periodStart = new Date(referenceDate);
  periodStart.setHours(0, 0, 0, 0);

  if (period === 'today') {
    const nextDay = new Date(periodStart);
    nextDay.setDate(nextDay.getDate() + 1);
    return transactions.filter((item) => {
      const date = new Date(item.date);
      return date >= periodStart && date < nextDay;
    });
  }

  if (period === '7d' || period === '30d') {
    const days = period === '7d' ? 7 : 30;
    periodStart.setDate(periodStart.getDate() - (days - 1));

    return transactions.filter((item) => {
      const date = new Date(item.date);
      return date >= periodStart && date <= referenceDate;
    });
  }

  return transactions.filter((item) => {
    const date = new Date(item.date);
    return (
      date.getUTCFullYear() === referenceDate.getUTCFullYear() &&
      date.getUTCMonth() === referenceDate.getUTCMonth()
    );
  });
};

const getReferenceDate = (transactions: Transaction[]): Date => {
  if (transactions.length === 0) {
    return new Date();
  }

  const latest = transactions.reduce((acc, item) => {
    const date = new Date(item.date);
    return date.getTime() > acc.getTime() ? date : acc;
  }, new Date(transactions[0].date));

  return latest;
};

const sumByType = (items: Transaction[]) => ({
  income: items
    .filter((item) => item.type === 'income')
    .reduce((acc, item) => acc + item.amount, 0),
  expense: items
    .filter((item) => item.type === 'expense')
    .reduce((acc, item) => acc + item.amount, 0),
});

const bucketByDay = (transactions: Transaction[], days: number, referenceDate: Date): ChartPoint[] => {
  const buckets: ChartPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - offset);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const dayTransactions = transactions.filter((item) => {
      const date = new Date(item.date);
      return date >= start && date < end;
    });

    const totals = sumByType(dayTransactions);

    buckets.push({
      label: `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`,
      income: totals.income,
      expense: totals.expense,
    });
  }

  return buckets;
};

const bucketByRollingWeeks = (
  transactions: Transaction[],
  totalDays: number,
  referenceDate: Date,
): ChartPoint[] => {
  const weeks = [
    { label: 'S1', startOffset: totalDays - 1, endOffset: 24 },
    { label: 'S2', startOffset: 23, endOffset: 18 },
    { label: 'S3', startOffset: 17, endOffset: 12 },
    { label: 'S4', startOffset: 11, endOffset: 6 },
    { label: 'S5', startOffset: 5, endOffset: 0 },
  ];

  return weeks.map((week) => {
    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - week.startOffset);

    const end = new Date(referenceDate);
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - week.endOffset);

    const points = transactions.filter((item) => {
      const date = new Date(item.date);
      return date >= start && date <= end;
    });

    const totals = sumByType(points);

    return {
      label: week.label,
      income: totals.income,
      expense: totals.expense,
    };
  });
};

const bucketByMonthWeeks = (transactions: Transaction[], referenceDate: Date): ChartPoint[] => {
  const monthStart = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1, 0, 0, 0, 0),
  );

  const weekBuckets = [
    { label: '01-07', start: 1, end: 7 },
    { label: '08-14', start: 8, end: 14 },
    { label: '15-21', start: 15, end: 21 },
    { label: '22-31', start: 22, end: 31 },
  ];

  return weekBuckets.map((bucket) => {
    const points = transactions.filter((item) => {
      const date = new Date(item.date);
      return (
        date.getUTCFullYear() === monthStart.getUTCFullYear() &&
        date.getUTCMonth() === monthStart.getUTCMonth() &&
        date.getUTCDate() >= bucket.start &&
        date.getUTCDate() <= bucket.end
      );
    });

    const totals = sumByType(points);

    return {
      label: bucket.label,
      income: totals.income,
      expense: totals.expense,
    };
  });
};

const buildChart = (transactions: Transaction[], period: PeriodFilter): ChartPoint[] => {
  const referenceDate = getReferenceDate(transactions);

  if (period === 'today') {
    return bucketByDay(transactions, 2, referenceDate);
  }
  if (period === '7d') {
    return bucketByDay(transactions, 7, referenceDate);
  }
  if (period === '30d') {
    return bucketByRollingWeeks(transactions, 30, referenceDate);
  }
  return bucketByMonthWeeks(transactions, referenceDate);
};

export const buildMockDashboard = (
  transactions: Transaction[],
  period: PeriodFilter,
): DashboardData => {
  const referenceDate = getReferenceDate(transactions);
  const transactionsInPeriod = filterTransactionsByPeriod(transactions, period, referenceDate);
  const fullSummary = buildSummary(transactions);
  const periodSummary = buildSummary(transactionsInPeriod);

  return {
    summary: {
      ...periodSummary,
      balance: fullSummary.balance,
    },
    transactions,
    periodTransactions: transactionsInPeriod,
    chart: buildChart(transactions, period),
  };
};
