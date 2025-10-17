// This file can be used for utility formatting functions.
export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback for invalid currency code
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};
