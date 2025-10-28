import { SenderIdWithSmsCenter } from '@/types/types';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { ServiceVendor } from '@libs/prisma/generated';

type ParsePhoneResult =
  | {
      data: {
        number: string;
        provider: ServiceVendor;
      };
      error: null;
    }
  | {
      data: null;
      error: string;
    };

/**
 * Parses and validates a phone number using libphonenumber-js.
 *
 * If the number is valid, returns the number in E.164 format and identifies the
 * provider based on the national number. Numbers starting with '9' are assumed
 * to belong to 'ETC', '7' to 'SCOM' and others are invalid.
 *
 * @example
 *   const result = parsePhone('+251912345678');
 *   if (result.error) {
 *     console.error(result.error);
 *   } else {
 *     console.log(result.data?.number); // "+251912345678"
 *     console.log(result.data?.provider); // "ETC"
 *   }
 *
 * @param {string} phoneNumber - The phone number to parse and validate.
 * @returns Data - {@link ParsePhoneResult} - An object containing the parsed
 *   number and provider, or an error message.
 */

export function parsePhone(phoneNumber: string): ParsePhoneResult {
  try {
    const result = parsePhoneNumberWithError(phoneNumber, 'ET');
    if (!result.isValid()) {
      return {
        data: null,
        error: 'Invalid phone number, number must be a valid Ethiopian number',
      };
    }
    let provider;

    if (result.nationalNumber.startsWith('9')) {
      provider = ServiceVendor.ETC;
    } else if (result.nationalNumber.startsWith('7')) {
      provider = ServiceVendor.SCOM;
    } else {
      return {
        data: null,
        error: 'Invalid phone number, number must be a valid Ethiopian number',
      };
    }

    return {
      data: {
        number: result.number,
        provider,
      },
      error: null,
    };
  } catch {
    return {
      data: null,
      error: 'Invalid phone number, number must be a valid Ethiopian number',
    };
  }
}

export function getPhoneProvider(phoneNumber: string): ServiceVendor {
  return parsePhone(phoneNumber).data!.provider;
}

export function getConfigForPhone({
  phone,
  config,
}: {
  phone: string;
  config: SenderIdWithSmsCenter[];
}) {
  const provider = getPhoneProviderSimple(phone);
  return config.find((item) => item.smsCenter?.vendor === provider);
}

export function getPhoneProviderSimple(
  phoneNumber: string,
): ServiceVendor | null {
  if (phoneNumber.startsWith('+2519')) {
    return ServiceVendor.ETC;
  } else if (phoneNumber.startsWith('+2517')) {
    return ServiceVendor.SCOM;
  } else {
    return null;
  }
}
