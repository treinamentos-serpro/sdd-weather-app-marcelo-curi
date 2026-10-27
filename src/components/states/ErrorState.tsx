import type { RequestError } from '../../types/weather';

interface ErrorStateProps {
  error: RequestError;
  onRetry: () => void | Promise<void>;
}

const errorMessages: Record<RequestError, string> = {
  network: 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
  provider: 'O serviço de busca não conseguiu concluir a solicitação. Tente novamente.',
  timeout: 'A busca demorou mais que o esperado. Tente novamente.',
};

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div
      className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-5 py-4 text-rose-100"
      role="alert"
    >
      <p>{errorMessages[error]}</p>
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
