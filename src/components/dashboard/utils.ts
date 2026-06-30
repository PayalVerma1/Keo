export function relativeTime(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function compactRelativeTime(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function formatLogTimestamp(date: string) {
  const value = new Date(date);
  const pad = (number: number, length = 2) => String(number).padStart(length, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}.${pad(value.getMilliseconds(), 3)}`;
}

export function formatDeploymentDate(date: string) {
  return new Date(date)
    .toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(",", "");
}

export function logColor(level: string) {
  if (level === "error") return "#ef4444";
  if (level === "warn") return "#f59e0b";
  if (level === "debug") return "#a78bfa";
  return "#60a5fa";
}

const serviceColors = ["#2ee59d", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#34d399", "#facc15"];

export function serviceColor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return serviceColors[Math.abs(hash) % serviceColors.length];
}

export const severityBadge: Record<string, { bg: string; text: string }> = {
  critical: { bg: "var(--accent-red)", text: "#fff" },
  high: { bg: "#f97316", text: "#fff" },
  medium: { bg: "var(--accent-yellow)", text: "#111" },
  low: { bg: "var(--accent-blue)", text: "#fff" },
};
