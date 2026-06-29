"use client";

import React from "react";
import { Loader2 } from "lucide-react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function Card({ children, className = "", style }: CardProps) {
  return (
    <div className={`card${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  right?: React.ReactNode;
};

export function SectionHeader({ title, right }: SectionHeaderProps) {
  return (
    <div className="card-header">
      <span className="card-title">{title}</span>
      {right}
    </div>
  );
}

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "60px 20px", alignItems: "center" }}>
      {icon && <div style={{ marginBottom: "16px" }}>{icon}</div>}
      <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>{title}</p>
      {description && (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "460px" }}>
          {description}
        </p>
      )}
    </div>
  );
}

export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", gap: 10 }}>
      <Loader2 size={28} className="spin" color="var(--accent-green)" />
      <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</span>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
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
      {message}
      {onRetry && (
        <>
          {" "}
          <button
            style={{
              color: "inherit",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
