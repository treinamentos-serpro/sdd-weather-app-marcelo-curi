const weatherDescriptions = new Map<number, string>([
  [0, 'Céu limpo'],
  [1, 'Predominantemente limpo'],
  [2, 'Parcialmente nublado'],
  [3, 'Nublado'],
  [45, 'Neblina'],
  [48, 'Neblina com depósito de gelo'],
  [51, 'Garoa fraca'],
  [53, 'Garoa moderada'],
  [55, 'Garoa intensa'],
  [56, 'Garoa congelante fraca'],
  [57, 'Garoa congelante intensa'],
  [61, 'Chuva fraca'],
  [63, 'Chuva moderada'],
  [65, 'Chuva intensa'],
  [66, 'Chuva congelante fraca'],
  [67, 'Chuva congelante intensa'],
  [71, 'Neve fraca'],
  [73, 'Neve moderada'],
  [75, 'Neve intensa'],
  [77, 'Grãos de neve'],
  [80, 'Pancadas de chuva fracas'],
  [81, 'Pancadas de chuva moderadas'],
  [82, 'Pancadas de chuva violentas'],
  [85, 'Pancadas de neve fracas'],
  [86, 'Pancadas de neve intensas'],
  [95, 'Trovoada'],
  [96, 'Trovoada com granizo fraco'],
  [99, 'Trovoada com granizo intenso'],
]);

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

export function describeWeatherCode(code: number | null): string | null {
  return code === null ? null : (weatherDescriptions.get(code) ?? null);
}

export function getWindDirection(degrees: number | null): string | null {
  if (degrees === null || !Number.isFinite(degrees)) {
    return null;
  }

  const normalized = ((degrees % 360) + 360) % 360;
  const sectorIndex = Math.floor((normalized + 11.25) / 22.5) % windDirections.length;
  return windDirections[sectorIndex];
}
