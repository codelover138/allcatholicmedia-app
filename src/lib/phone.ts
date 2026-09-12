import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/max';

import { COUNTRY_NAMES } from '@/lib/country-names';

export type PhoneCountry = { code: CountryCode; name: string; callingCode: string };

export const PHONE_COUNTRIES: PhoneCountry[] = getCountries()
  .map((code) => ({ code, name: COUNTRY_NAMES[code] ?? code, callingCode: getCountryCallingCode(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function defaultPhoneCountry(): CountryCode {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const region = locale.match(/(?:^|-)([A-Z]{2})(?:$|-)/)?.[1] as CountryCode | undefined;
  return region && PHONE_COUNTRIES.some((item) => item.code === region) ? region : 'US';
}

/** Split a saved international number so an existing member can edit it. */
export function phoneInputFromSaved(value: string | null | undefined):
  { country: CountryCode; nationalNumber: string } {
  const fallback = defaultPhoneCountry();
  const saved = value?.trim() ?? '';
  if (!saved) return { country: fallback, nationalNumber: '' };
  if (saved.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(saved);
    if (parsed?.country) return { country: parsed.country, nationalNumber: parsed.nationalNumber };
  }
  return { country: fallback, nationalNumber: saved };
}

/** Returns an E.164 mobile number, or a message suitable for the form. */
export function validateMobileNumber(input: string, country: CountryCode):
  { number?: string; error?: string } {
  const value = input.trim();
  if (!value) return {};
  if (value.startsWith('+')) {
    return { error: 'Choose the country code above, then enter the mobile number without it.' };
  }
  if (!/^[\d\s().-]+$/.test(value) || (value.match(/\d/g)?.length ?? 0) > 15) {
    return { error: 'Enter a mobile number using digits, spaces, or dashes.' };
  }

  const phone = parsePhoneNumberFromString(value, country);
  if (!phone || !phone.isValid() || phone.country !== country) {
    return { error: 'Enter a valid mobile number for the selected country.' };
  }
  const type = phone.getType();
  if (type !== 'MOBILE' && type !== 'FIXED_LINE_OR_MOBILE') {
    return { error: 'Enter a mobile number, not a landline or service number.' };
  }
  return { number: phone.number };
}
