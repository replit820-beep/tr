import { createFileRoute } from "@tanstack/react-router";

const REQUIRED_PUBLIC = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
const REQUIRED_SERVER = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const missing = REQUIRED_SERVER.filter((k) => !process.env[k]);
        const status = missing.length === 0 ? "ok" : "degraded";
        return new Response(
          JSON.stringify({
            status,
            timestamp: new Date().toISOString(),
            runtime: typeof process !== "undefined" ? "node" : "edge",
            missingServerEnv: missing,
            requiredPublicEnv: REQUIRED_PUBLIC,
            requiredServerEnv: REQUIRED_SERVER,
          }, null, 2),
          {
            status: missing.length === 0 ? 200 : 503,
            headers: { "content-type": "application/json" },
          },
        );
      },
    },
  },
});
