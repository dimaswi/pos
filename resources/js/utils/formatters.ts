/**
 * Utility functions for number formatting
 */

/**
 * Format currency in Indonesian Rupiah without decimal places
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format number with Indonesian locale (for quantities, etc.)
 */
export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

/**
 * Format percentage with 1 decimal place
 */
export const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100);
};
