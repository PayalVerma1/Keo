interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="mb-6 rounded-lg border border-[var(--accent-red)] bg-[var(--accent-red-dim)] px-4 py-3 text-[13px] text-[var(--accent-red)]">
      {message} -{" "}
      <button
        type="button"
        className="min-h-10 cursor-pointer rounded-md border-0 bg-transparent px-1 text-inherit underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}
