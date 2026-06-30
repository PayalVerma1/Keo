"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { ChartPoint } from "./types";

export function MetricBarCard({
  title,
  data,
  color,
  opacity = 1,
}: {
  title: string;
  data: ChartPoint[];
  color: string;
  opacity?: number;
}) {
  return (
    <div className="card chart-card">
      <div className="card-header" style={{ marginBottom: "8px" }}>
        <span className="card-title">{title}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Last 30m</span>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={20}>
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#1e1f26",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} opacity={opacity} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="card chart-card" style={{ justifyContent: "center", alignItems: "center" }}>
      <Loader2 size={24} className="spin" color="var(--text-muted)" />
    </div>
  );
}

export function ServiceLineChart({
  data,
  dataKey,
  color,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
        <Tooltip contentStyle={{ background: "#1e1f26", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "12px" }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ServiceBarChart({
  data,
  dataKey,
  color,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barSize={16}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
        <Tooltip contentStyle={{ background: "#1e1f26", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "12px" }} />
        <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} opacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MiniBarChart({ color }: { color: string }) {
  const data = Array.from({ length: 10 }).map((_, index) => ({
    value: 20 + Math.sin(index * 0.8) * 15 + Math.random() * 30,
  }));

  return (
    <ResponsiveContainer width="100%" height={70}>
      <BarChart data={data} barSize={8}>
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={index > 6 ? color : `${color}55`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
