import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  onSelectCity: (city: City) => void | Promise<void>;
}

function getQualifiers(city: City): string[] {
  return [city.admin1, city.country].filter(
    (qualifier): qualifier is string =>
      typeof qualifier === 'string' && qualifier.trim().length > 0,
  );
}

function getDisplayKey(city: City): string {
  return JSON.stringify([city.name, ...getQualifiers(city)]);
}

export default function CityResults({ cities, onSelectCity }: CityResultsProps) {
  if (cities.length === 0) {
    return null;
  }

  const displayCounts = new Map<string, number>();
  for (const city of cities) {
    const key = getDisplayKey(city);
    displayCounts.set(key, (displayCounts.get(key) ?? 0) + 1);
  }

  const ambiguousCities = cities.filter(
    (city) => (displayCounts.get(getDisplayKey(city)) ?? 0) > 1,
  );
  const selectableCities = cities.filter(
    (city) => (displayCounts.get(getDisplayKey(city)) ?? 0) === 1,
  );

  return (
    <section aria-label="Resultados da busca" className="space-y-3">
      {ambiguousCities.length > 0 && (
        <p
          className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          Há cidades com o mesmo nome e qualificadores. Refine a busca para distinguir esses
          resultados.
        </p>
      )}
      {selectableCities.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {selectableCities.map((city) => {
            const qualifiers = getQualifiers(city);
            return (
              <li key={city.id}>
                <button
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-accent-400/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
                  onClick={() => void onSelectCity(city)}
                  type="button"
                >
                  <span className="block font-semibold text-white">{city.name}</span>
                  {qualifiers.length > 0 && (
                    <span className="mt-1 block text-sm text-slate-300">
                      {qualifiers.join(', ')}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
