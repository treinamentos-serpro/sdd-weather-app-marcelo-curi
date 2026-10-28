export { describeWeatherCode } from './weatherCodes';

const windDirections = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'L',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSO',
  'SO',
  'OSO',
  'O',
  'ONO',
  'NO',
  'NNO',
];

export function buildForecastDates(now: Date, timezone: string): string[] {
  const localDate = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const parts = Object.fromEntries(localDate.map(({ type, value }) => [type, value]));
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new RangeError(`Unable to determine local date for timezone "${timezone}".`);
  }

  const firstDay = Date.UTC(year, month - 1, day);
  return Array.from({ length: 5 }, (_, offset) =>
    new Date(firstDay + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
}

export function formatWeatherTimestamp(timestamp: string, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
    timeZoneName: 'short',
  }).format(new Date(timestamp));
}

export function isWeatherStale(
  sourceValidAt: string | null,
  referenceTime: Date = new Date(),
): boolean {
  if (sourceValidAt === null) {
    return false;
  }

  const sourceTime = Date.parse(sourceValidAt);
  const referenceTimestamp = referenceTime.getTime();
  if (!Number.isFinite(sourceTime) || !Number.isFinite(referenceTimestamp)) {
    throw new RangeError('Weather timestamps must be valid dates.');
  }

  return referenceTimestamp - sourceTime > 24 * 60 * 60 * 1000;
}

export function getWindDirection(degrees: number | null): string | null {
  if (degrees === null || !Number.isFinite(degrees)) {
    return null;
  }

  const normalized = ((degrees % 360) + 360) % 360;
  const sectorIndex = Math.floor((normalized + 11.25) / 22.5) % windDirections.length;
  return windDirections[sectorIndex];
}
