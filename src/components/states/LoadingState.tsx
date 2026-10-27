interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = 'Carregando dados meteorológicos...',
}: LoadingStateProps) {
  return (
    <p
      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-slate-200"
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
