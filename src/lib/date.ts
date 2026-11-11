const EAST_AFRICA_TIME_ZONE = 'Africa/Nairobi';

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
