/**
 * Helper utility to format user phone numbers into E.164 format.
 * Defaults to configuration or +91 (India) if no country code is found.
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';

  // Cast to string and clean all non-numeric characters except +
  let cleaned = String(phone).replace(/[^\d+]/g, '');

  const defaultCountryCode = (process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '+91').replace(/[^\d+]/g, '');
  const cleanPrefix = defaultCountryCode.startsWith('+') ? defaultCountryCode : `+${defaultCountryCode}`;

  // If number starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If it already starts with a plus, assume it's formatted
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If it's a 10-digit number, prepend default country code
  if (cleaned.length === 10) {
    return `${cleanPrefix}${cleaned}`;
  }

  // If it starts with the clean country code but without a plus (e.g., 919876543210), prepend plus
  const rawPrefix = cleanPrefix.replace('+', '');
  if (cleaned.startsWith(rawPrefix) && cleaned.length === (rawPrefix.length + 10)) {
    return `+${cleaned}`;
  }

  // If it's longer than 10 but doesn't have a plus, prepend plus
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  // Fallback
  return `${cleanPrefix}${cleaned}`;
};
