export function verdictTone(status: string): "pass" | "warn" | "fail" | "pending" {
  if (status === "PASSED" || status === "PASS") return "pass";
  if (status === "WARNING" || status === "WARN") return "warn";
  if (status === "FAILED" || status === "FAIL" || status === "ERROR") return "fail";
  return "pending";
}

export function verdictLabel(status: string): string {
  switch (status) {
    case "PASSED":
    case "PASS":
      return "PASS";
    case "WARNING":
    case "WARN":
      return "WARN";
    case "FAILED":
    case "FAIL":
      return "FAIL";
    case "ERROR":
      return "ERROR";
    case "QUEUED":
      return "QUEUED";
    case "COLLECTING":
      return "COLLECTING";
    case "PROCESSING":
      return "PROCESSING";
    default:
      return status;
  }
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`verdict-pill ${verdictTone(status)}`}>{verdictLabel(status)}</span>;
}
