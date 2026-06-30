"use client";

import { Loader2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ChartPoint {
  time: string;
  value: number;
}

interface ChartCardProps {
  title: string;
  data: ChartPoint[];
  color: string;
  opacity?: number;
}

export function ChartCard({ title, data, color, opacity = 1 }: ChartCardProps) {
  return (
    <div className="card chart-card">
      <div className="card-header mb-2">
        <span className="card-title">{title}</span>
        <span className="text-[11px] text-[var(--text-muted)]">Last 30m</span>
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
    <div className="card chart-card items-center justify-center">
      <Loader2 size={24} className="spin text-[var(--text-muted)]" aria-hidden="true" />
    </div>
  );
}
