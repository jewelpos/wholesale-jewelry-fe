/**
 * Utility function to automatically detect a user's currency using browser APIs
 * @returns {Object} Object containing currency code, symbol, and formatting functions
 */
export function detectUserCurrency() {
    try {
        // Get user's locale from browser
        const userLocale = navigator.language || 'en-US';

        // Get currency information based on the locale
        const formatter = new Intl.NumberFormat(userLocale, {
            style: 'currency',
            currency: getCurrencyFromLocale(userLocale),
            currencyDisplay: 'symbol'
        });

        // Extract currency code from the formatter
        const parts = formatter.formatToParts(123);
        const currencyPart = parts.find(part => part.type === 'currency');
        const currencyCode = getCurrencyFromLocale(userLocale);
        const currencySymbol = currencyPart ? currencyPart.value : '$';

        return {
            code: currencyCode,
            symbol: currencySymbol,
            format: (amount: string | number | bigint) => formatter.format(typeof amount === 'string' ? parseFloat(amount) : amount),
            formatWithoutSymbol: (amount: string | number | bigint) => {
                return formatter.formatToParts(typeof amount === 'string' ? parseFloat(amount) : amount)
                    .filter(part => part.type !== 'currency' && part.type !== 'literal')
                    .map(part => part.value)
                    .join('');
            }
        };
    } catch (error) {
        console.error('Error detecting currency:', error);
        // Default to USD on error
        return {
            code: 'USD',
            symbol: '$',
            format: (amount: number) => `$${amount.toFixed(2)}`,
            formatWithoutSymbol: (amount: number) => amount.toFixed(2)
        };
    }
}

/**
 * Maps common locales to their default currency codes
 * @param {string} locale - Browser locale string (e.g., 'en-US', 'ja-JP')
 * @returns {string} ISO currency code
 */
function getCurrencyFromLocale(locale: string) {
    const localeCurrencyMap: { [key: string]: string } = {
        'en-US': 'USD',
        'en-GB': 'GBP',
        'en-CA': 'CAD',
        'en-AU': 'AUD',
        'en-NZ': 'NZD',
        'ja-JP': 'JPY',
        'zh-CN': 'CNY',
        'zh-HK': 'HKD',
        'zh-TW': 'TWD',
        'ko-KR': 'KRW',
        'de-DE': 'EUR',
        'fr-FR': 'EUR',
        'it-IT': 'EUR',
        'es-ES': 'EUR',
        'ru-RU': 'RUB',
        'pt-BR': 'BRL',
        'hi-IN': 'INR',
        'tr-TR': 'TRY'
    };

    // Check if we have a direct mapping
    if (localeCurrencyMap[locale as keyof typeof localeCurrencyMap]) {
        return localeCurrencyMap[locale];
    }

    // Extract country code and check if it matches a currency
    const countryCode = locale.split('-')[1];
    if (countryCode) {
        switch (countryCode) {
            case 'US': return 'USD';
            case 'GB': return 'GBP';
            case 'CA': return 'CAD';
            case 'AU': return 'AUD';
            case 'JP': return 'JPY';
            case 'CN': return 'CNY';
            case 'HK': return 'HKD';
            case 'KR': return 'KRW';
            case 'IN': return 'INR';
            // Euro countries
            case 'DE':
            case 'FR':
            case 'IT':
            case 'ES':
            case 'PT':
            case 'NL':
            case 'BE':
            case 'AT':
            case 'FI':
            case 'IE':
                return 'EUR';
            default:
                return 'USD'; // Default to USD if unknown
        }
    }

    return 'USD'; // Default fallback
}

// Example usage:
// const currency = detectUserCurrency();
// console.log(currency.code);        // "USD"
// console.log(currency.symbol);      // "$"
// console.log(currency.format(1999.99));  // "$1,999.99"
// console.log(currency.formatWithoutSymbol(1999.99));  // "1,999.99"