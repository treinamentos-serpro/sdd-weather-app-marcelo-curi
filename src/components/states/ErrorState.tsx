import { formatWeatherTimestamp } from '../../lib/weather';
import type { RequestError, WeatherError, WeatherSnapshot } from '../../types/weather';

type ErrorStateProps =
  | {
      context: 'search';
      error: RequestError;
      onRetry: () => void | Promise<void>;
      snapshot?: never;
    }
  | {
      context: 'weather';
      error: WeatherError;
      onRetry: () => void | Promise<void>;
      snapshot?: WeatherSnapshot | null;
    };

const searchMessages: Record<Exclude<WeatherError, 'unavailable'>, string> = {
  network:
    'Não foi possível conectar ao serviço de busca. Verifique sua conexão e tente novamente.',
  provider: 'O serviço de busca não conseguiu concluir a solicitação. Tente novamente.',
  timeout: 'A busca demorou mais que o esperado. Tente novamente.',
};

const weatherMessages: Record<WeatherError, string> = {
  network: 'Não foi possível conectar ao serviço meteorológico. Tente novamente.',
  provider: 'O serviço meteorológico retornou uma resposta inválida. Tente novamente.',
  timeout: 'A consulta meteorológica demorou mais que o esperado. Tente novamente.',
  unavailable: 'As condições atuais estão indisponíveis para esta localidade. Tente novamente.',
};

export default function ErrorState({ context, error, onRetry, snapshot = null }: ErrorStateProps) {
  const message = context === 'search' ? searchMessages[error] : weatherMessages[error];

  return (
    <div
      className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-5 py-4 text-rose-100"
      role="alert"
    >
      <p>{message}</p>
      {context === 'weather' && snapshot !== null && (
        <p className="mt-2 text-sm text-rose-100/80">
          Exibindo dados anteriores de {snapshot.city.name}, obtidos em{' '}
          {formatWeatherTimestamp(snapshot.fetchedAt, snapshot.city.timezone)}.
        </p>
      )}
      <button
        className="mt-3 rounded-lg border border-rose-100/40 px-4 py-2 font-medium text-white hover:bg-rose-100/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => void onRetry()}
        type="button"
      >
        Tentar novamente
      </button>
    </div>
  );
}
