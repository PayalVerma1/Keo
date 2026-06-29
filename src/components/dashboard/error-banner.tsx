interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      style={{
        background: "var(--accent-red-dim)",
        border: "1px solid var(--accent-red)",
        borderRadius: "8px",
        padding: "12px 16px",
        color: "var(--accent-red)",
        marginBottom: "24px",
        fontSize: "13px",
      }}
    >
      ⚠ {message} –{" "}
      <button
        style={{
          color: "inherit",
          background: "none",
          border: "none",
          cursor: "pointer",
          textDecoration: "underline",
        }}
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}
