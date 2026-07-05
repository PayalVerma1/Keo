"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import { socket as sharedSocket } from "@/lib/socket";
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
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [socketState, setSocketState] = useState<"connecting" | "live" | "offline">("connecting");
  const socketRef = useRef<Socket | null>(null);
  const joinedServicesRef = useRef<string[]>([]);

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

  const fetchDashboard = useCallback(async (token: string) => {
    try {
      const [metricsRes, servicesRes] = await Promise.all([
        fetch("/api/dashboard/metrics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/services", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (metricsRes.status === 401 || servicesRes.status === 401) {
        localStorage.removeItem("obs_token");
        localStorage.removeItem("obs_user");
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
    setMounted(true);

    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedUser = localStorage.getItem("obs_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }

    fetchDashboard(token);

    const socket = sharedSocket;
    socketRef.current = socket;
    setSocketState("connecting");

    socket.on("connect", () => {
      setSocketState("live");
    });
    socket.on("disconnect", () => setSocketState("offline"));
    socket.on("connect_error", () => setSocketState("offline"));

    const refreshFromSocket = () => {
      const currentToken = localStorage.getItem("obs_token");
      if (currentToken) {
        fetchDashboard(currentToken);
      }
    };

    socket.on("metric:created", refreshFromSocket);
    socket.on("log:created", refreshFromSocket);
    socket.on("deployment:created", refreshFromSocket);
    socket.on("anomaly:detected", refreshFromSocket);

    return () => {
      socket.off("metric:created", refreshFromSocket);
      socket.off("log:created", refreshFromSocket);
      socket.off("deployment:created", refreshFromSocket);
      socket.off("anomaly:detected", refreshFromSocket);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socketRef.current = null;
      joinedServicesRef.current = [];
    };
  }, [router, fetchDashboard]);

  const handleLogout = () => {
    localStorage.removeItem("obs_token");
    localStorage.removeItem("obs_user");
    router.replace("/login");
  };

  if (!mounted) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar onLogout={handleLogout} userName={user?.name ?? ""} socketState={socketState} />

      <main className="main-content">
        <Topbar userName={user?.name} />

        <div className="dashboard-scroll-area">
          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => {
                setError("");
                setLoading(true);
                const token = localStorage.getItem("obs_token");
                if (token) fetchDashboard(token);
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
