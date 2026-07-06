// Module-level active currency — set once when store data loads, used everywhere.
let _code = 'USD';
let _formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function setCurrencyCode(code: string | null | undefined) {
  const c = (code || 'USD').toUpperCase();
  if (c === _code) return;
  _code = c;
  try {
    _formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: c });
  } catch {
    _formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  }
}

export function getCurrencyCode() {
  return _code;
}

/** Format a number using the active store currency. Safe to call outside React. */
export function formatCurrency(amount: number | string | null | undefined): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return _formatter.format(Number.isFinite(n) ? n : 0);
}

/**
 * Build a formatter object for use inside React components (via useCurrency hook).
 * Falls back to USD on invalid code.
 */
export function makeCurrencyFormatter(currencyCode?: string | null) {
  const code = (currencyCode || 'USD').toUpperCase();
  try {
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: code });
    return {
      code,
      format: (amount: number | string) => fmt.format(typeof amount === 'string' ? parseFloat(amount) || 0 : amount),
      formatFixed: (amount: number | string) => fmt.format(typeof amount === 'string' ? parseFloat(amount) || 0 : amount),
    };
  } catch {
    const fallback = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    return {
      code: 'USD',
      format: (amount: number | string) => fallback.format(typeof amount === 'string' ? parseFloat(amount) || 0 : amount),
      formatFixed: (amount: number | string) => fallback.format(typeof amount === 'string' ? parseFloat(amount) || 0 : amount),
    };
  }
}

/** @deprecated Use formatCurrency() or useCurrency() hook instead */
export function detectUserCurrency() {
  return makeCurrencyFormatter(_code);
}
