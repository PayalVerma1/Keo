export function LiveStream() {
  const rows = [
    { time: "just now", tone: "term-info", label: "[INFO]", message: "Dashboard loaded - 0 service(s) monitored" },
    { time: "4s ago", tone: "term-info", label: "[INFO]", message: "Re-indexing shard #4 completed" },
    { time: "8s ago", tone: "term-err", label: "[ERR]", message: "Failed to fetch metrics: Timeout" },
    { time: "12s ago", tone: "term-warn", label: "[WARN]", message: "Throttling API request client:831..." },
    { time: "20s ago", tone: "term-info", label: "[INFO]", message: "Auth-Service: Token verified" },
  ];

  return (
    <div className="card flex-1">
      <div className="card-header">
        <span className="card-title">LIVE STREAM</span>
        <div className="stat-trend trend-up">
          <div className="status-dot" /> STREAMING
        </div>
      </div>
      <div className="terminal" id="live-stream-terminal">
        {rows.map((row) => (
          <div key={`${row.time}-${row.label}`}>
            <span className="term-time">{row.time}</span>
            <span className={row.tone}>{row.label}</span>
            {row.message}
          </div>
        ))}
      </div>
    </div>
  );
}
