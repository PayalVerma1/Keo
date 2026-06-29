export function LiveStream() {
  return (
    <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div className="card-header">
        <span className="card-title">LIVE STREAM</span>
        <div className="stat-trend trend-up">
          <div className="status-dot" /> STREAMING
        </div>
      </div>
      <div className="terminal" id="live-stream-terminal">
        <div>
          <span className="term-time">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span className="term-info">[INFO]</span>
          Dashboard loaded – 0 service(s) monitored
        </div>
        <div>
          <span className="term-time">{new Date(Date.now() - 4000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span className="term-info">[INFO]</span>
          Re-indexing shard #4 completed
        </div>
        <div>
          <span className="term-time">{new Date(Date.now() - 8000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span className="term-err">[ERR]</span>
          Failed to fetch metrics: Timeout
        </div>
        <div>
          <span className="term-time">{new Date(Date.now() - 12000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span className="term-warn">[WARN]</span>
          Throttling API request client:831...
        </div>
        <div>
          <span className="term-time">{new Date(Date.now() - 20000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span className="term-info">[INFO]</span>
          Auth-Service: Token verified
        </div>
      </div>
    </div>
  );
}
