"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { BrainCircuit, Eye, EyeOff, Loader2, Shield } from "lucide-react";

const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "This email is already registered with a different sign-in method. Use the original method.",
  OAuthSignin: "Could not start OAuth sign-in. Check your OAuth credentials.",
  OAuthCallback: "OAuth sign-in failed. Try again.",
  Callback: "Sign-in callback error. Try again.",
  AccessDenied: "Access denied.",
  Default: "An unknown error occurred. Try again.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show NextAuth error passed as ?error= query param
    const errCode = searchParams?.get("error");
    if (errCode) {
      setError(AUTH_ERRORS[errCode] ?? AUTH_ERRORS.Default);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [router, status]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Something went wrong");
          setLoading(false);
          return;
        }

        // Auto sign-in after successful registration
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          setMode("login");
          setForm({ name: "", email: form.email, password: "" });
          setError("");
          return;
        }

        router.replace("/");
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.replace("/");
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setError("");
    setLoading(true);
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <BrainCircuit size={28} color="#312E81" />
          </div>
          <span className="login-brand">Keo</span>
        </div>

        <h1 className="login-title">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="login-subtitle">
          {mode === "login"
            ? "Sign in to access your observability dashboard"
            : "Create a new account for the dashboard"}
        </p>

        {mode === "login" && (
          <div className="mb-4 grid gap-3">
            <button type="button" className="form-submit" onClick={() => handleOAuthLogin("google")} disabled={loading}>
              Continue with Google
            </button>
            <button type="button" className="form-submit" onClick={() => handleOAuthLogin("github")} disabled={loading}>
              Continue with GitHub
            </button>
          </div>
        )}

        {mode === "login" && <div className="mb-4 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}><Shield size={14} /> Sign in with an existing account or register below.</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required={mode === "register"}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="form-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            id="submit-auth"
            type="submit"
            className="form-submit"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="login-switch">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                id="switch-to-register"
                className="switch-btn"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                id="switch-to-login"
                className="switch-btn"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
