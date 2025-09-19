/**
 * Utility functions for formatting data
 * Pure functions with no side effects
 */

/**
 * Format wallet address for display
 */
export function formatAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number | string, currency = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(numAmount);
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: string | number, decimals = 18, displayDecimals = 4): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const divisor = Math.pow(10, decimals);
  const formatted = numAmount / divisor;
  
  return formatted.toFixed(displayDecimals);
}

/**
 * Format percentage change
 */
export function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
