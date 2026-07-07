import { getCurrencySymbol } from "@/data/fundraisingOptions";

export const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${getCurrencySymbol(currency)}${amount.toLocaleString()}`;
  }
};

export const getProgressPercentage = (raised: number, target: number) => {
  return Math.min((raised / target) * 100, 100);
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'nano': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    case 'micro': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'small': return 'bg-violet-500/10 text-violet-700 border-violet-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const getDaysLeft = (deadline: string) => {
  const now = new Date();
  const end = new Date(deadline);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};
