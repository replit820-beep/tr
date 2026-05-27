import { useEffect, useState } from "react";

const REQUIRED = [
  { key: "VITE_SUPABASE_URL", label: "Supabase URL" },
  { key: "VITE_SUPABASE_PUBLISHABLE_KEY", label: "Supabase Publishable Key" },
] as const;

export function EnvGuard({ children }: { children: React.ReactNode }) {
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    const env = import.meta.env as Record<string, string | undefined>;
    const miss = REQUIRED.filter((r) => !env[r.key]).map((r) => r.label);
    setMissing(miss);
  }, []);

  if (missing.length === 0) return <>{children}</>;

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      background: "#0f172a", color: "#fff", padding: "1.5rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>
          App configuration incomplete
        </h1>
        <p style={{ color: "#94a3b8", margin: "0 0 20px", fontSize: 14 }}>
          The following environment variables are missing. Add them in your
          Vercel project (Settings → Environment Variables) and redeploy.
        </p>
        <ul style={{
          listStyle: "none", padding: 16, margin: "0 0 20px",
          background: "#1e293b", borderRadius: 8, textAlign: "left",
          fontFamily: "ui-monospace, monospace", fontSize: 13,
        }}>
          {missing.map((m) => (
            <li key={m} style={{ padding: "4px 0", color: "#fca5a5" }}>✗ {m}</li>
          ))}
        </ul>
        <a href="/api/health" style={{
          display: "inline-block", padding: "10px 18px",
          background: "#3b82f6", color: "#fff", borderRadius: 6,
          textDecoration: "none", fontSize: 14, fontWeight: 500,
        }}>Check /api/health</a>
      </div>
    </div>
  );
}
