"use client";

import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

// ── Badge ─────────────────────────────────────────────────────────────────────
export type BadgeVariant = "critical" | "high" | "medium" | "low" | "success" | "warn" | "info" | "debug" | "neutral";

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  critical: { background: "rgba(239,68,68,0.18)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)" },
  high:     { background: "rgba(249,115,22,0.18)",  color: "#f97316", border: "1px solid rgba(249,115,22,0.4)" },
  medium:   { background: "rgba(245,158,11,0.15)",  color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)" },
  low:      { background: "rgba(59,130,246,0.15)",  color: "#60a5fa", border: "1px solid rgba(96,165,250,0.4)" },
  success:  { background: "rgba(46,200,133,0.12)",  color: "#2ee59d", border: "1px solid rgba(46,200,133,0.3)" },
  warn:     { background: "rgba(245,158,11,0.1)",   color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)" },
  info:     { background: "transparent",            color: "#60a5fa", border: "1px solid rgba(96,165,250,0.35)" },
  debug:    { background: "transparent",            color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" },
  neutral:  { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" },
};

export function Badge({
  variant,
  children,
  size = "sm",
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: "xs" | "sm";
}) {
  const padding = size === "xs" ? "1px 6px" : "2px 10px";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding,
        borderRadius: 4,
        fontSize: size === "xs" ? 10 : 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        ...BADGE_STYLES[variant],
      }}
    >
      {children}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  color = "#fff",
  sub,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: "#111218",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "rgba(255,255,255,0.35)",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{description}</p>
        )}
      </div>
      {children && <div style={{ display: "flex", gap: 10 }}>{children}</div>}
    </div>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────────
export function Pill({
  children,
  color,
  bg,
  border,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
}) {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: bg ?? "rgba(255,255,255,0.06)",
        color: color ?? "rgba(255,255,255,0.5)",
        border: border ?? "1px solid rgba(255,255,255,0.08)",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {children}
    </span>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ margin: "0 auto 12px", display: "flex", justifyContent: "center", opacity: 0.25 }}>
        {icon}
      </div>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
        {title}
      </p>
      {description && (
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>{description}</p>
      )}
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.3)" }}>
      <Loader2
        size={28}
        style={{ margin: "0 auto 10px", display: "block", animation: "spin 1s linear infinite" }}
      />
      <p style={{ fontSize: 13 }}>{label}</p>
    </div>
  );
}

// ── ActionButton ──────────────────────────────────────────────────────────────
export function ActionButton({
  children,
  variant = "secondary",
  onClick,
  type = "button",
  disabled,
  style,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
    fontWeight: 500,
    border: "none",
    opacity: disabled ? 0.5 : 1,
    transition: "opacity 0.2s",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: "#3b82f6", color: "#fff", fontWeight: 600 },
    secondary: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" },
    danger:    { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: type === "success" ? "rgba(46,200,133,0.12)" : "rgba(239,68,68,0.12)",
        border: `1px solid ${type === "success" ? "#2ee59d" : "#ef4444"}`,
        borderRadius: 10,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 1000,
        color: type === "success" ? "#2ee59d" : "#ef4444",
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {message}
    </div>
  );
}

// ── InfoRow (key-value pair in monospace detail panels) ──────────────────────
export function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div style={{ fontFamily: "monospace", fontSize: 13, lineHeight: 1.8 }}>
      <span style={{ color: "rgba(255,255,255,0.4)" }}>{label}: </span>
      <span style={{ color: valueColor ?? "#2ee59d" }}>{value}</span>
    </div>
  );
}
