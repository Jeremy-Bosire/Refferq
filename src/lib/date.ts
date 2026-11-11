const EAST_AFRICA_TIME_ZONE = 'Africa/Nairobi';

/** Return the calendar month containing an instant in Nairobi, independent of server timezone. */
export function getMonthKeyEAT(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EAST_AFRICA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return year && month ? `${year}-${month}` : '';
}

/** Format dates for Kenyan users using EAT and day/month/year ordering. */
export function formatDateEAT(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const displayOptions = Object.keys(options).length === 0
    ? { day: '2-digit', month: '2-digit', year: 'numeric' } as Intl.DateTimeFormatOptions
    : options;

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: EAST_AFRICA_TIME_ZONE,
    ...displayOptions,
  }).format(date);
}

export function formatDateTimeEAT(value: Date | string | number): string {
  return formatDateEAT(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
