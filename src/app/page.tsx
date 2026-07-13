"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Socket } from "socket.io-client";
import { socket as sharedSocket } from "@/lib/socket";
import { useSocketState } from "@/lib/useSocketState";
import { Activity } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ServiceMetricCards } from "@/components/dashboard/metric-card";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { EmptyMetricsState } from "@/components/dashboard/empty-state";
import { ChartCard, ChartSkeleton } from "@/components/dashboard/chart-card";
import { InsightsPanel } from "@/components/dashboard/insight-card";
import { LiveStream } from "@/components/dashboard/live-stream";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartPoint { time: string; value: number }
interface DashboardData {
  cpu: ChartPoint[];
  memory: ChartPoint[];
  latency: ChartPoint[];
  errors: ChartPoint[];
  summary: {
    totalServices: number;
    activeAlerts: number;
    avgLatency: string;
    errorRate: string;
  };
}



// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const socketState = useSocketState();
  const socketRef = useRef<Socket | null>(null);
  const joinedServicesRef = useRef<string[]>([]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const joinServiceRooms = useCallback((services: Array<{ id: string; name: string }>) => {
    const socket = socketRef.current;
    if (!socket) return;

    const pending = services.filter((service) => !joinedServicesRef.current.includes(service.id));
    pending.forEach((service) => {
      socket.emit("service:join", service.id);
    });

    if (pending.length > 0) {
      joinedServicesRef.current = [...joinedServicesRef.current, ...pending.map((service) => service.id)];
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const [metricsRes, servicesRes] = await Promise.all([
        fetch("/api/dashboard/metrics"),
        fetch("/api/services"),
      ]);

      if (metricsRes.status === 401 || servicesRes.status === 401) {
        router.replace("/login");
        return;
      }

      if (!metricsRes.ok) throw new Error("Failed to load dashboard data");
      if (!servicesRes.ok) throw new Error("Failed to load services");

      const json: DashboardData = await metricsRes.json();
      const services = (await servicesRes.json()) as Array<{ id: string; name: string }>;

      setData(json);
      joinServiceRooms(services);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [joinServiceRooms, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetchDashboard();

    const socket = sharedSocket;
    socketRef.current = socket;

    socket.on("metric:created", fetchDashboard);
    socket.on("log:created", fetchDashboard);
    socket.on("deployment:created", fetchDashboard);
    socket.on("anomaly:detected", fetchDashboard);

    return () => {
      socket.off("metric:created", fetchDashboard);
      socket.off("log:created", fetchDashboard);
      socket.off("deployment:created", fetchDashboard);
      socket.off("anomaly:detected", fetchDashboard);
      socketRef.current = null;
      joinedServicesRef.current = [];
    };
  }, [status, fetchDashboard]);

  const handleLogout = () => signOut({ callbackUrl: "/login" });

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="layout-wrapper">
      <Sidebar onLogout={handleLogout} userName={session?.user?.name ?? ""} socketState={socketState} />

      <main className="main-content">
        <Topbar userName={session?.user?.name ?? undefined} />

        <div className="dashboard-scroll-area">
          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => {
                setError("");
                setLoading(true);
                fetchDashboard();
              }}
            />
          )}

          <div className="dashboard-grid">
            <div>
              <ServiceMetricCards loading={loading} data={data} />

              {!loading && data && data.cpu.length > 0 ? (
                <div className="charts-grid">
                  <ChartCard title="CPU USAGE (%)" data={data.cpu} color="#4B5563" />
                  <ChartCard title="MEMORY (GB)" data={data.memory} color="#10B981" opacity={0.7} />
                  <ChartCard title="LATENCY (MS)" data={data.latency} color="#B45309" opacity={0.8} />
                  <ChartCard title="ERROR RATE (%)" data={data.errors} color="#EF4444" opacity={0.6} />
                </div>
              ) : loading ? (
                <div className="charts-grid">
                  <ChartSkeleton />
                  <ChartSkeleton />
                  <ChartSkeleton />
                  <ChartSkeleton />
                </div>
              ) : (
                <EmptyMetricsState />
              )}


            </div>

            <div className="right-sidebar">
              <InsightsPanel />
              <LiveStream />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
