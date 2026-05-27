import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SERVICES, type ServiceKey, type ActionKey } from "@/lib/services";
import {
  LayoutDashboard, Package, TrendingUp, AlertCircle, CheckCircle2,
  Clock, Loader2, XCircle, CircleDot, ChevronDown, ChevronUp,
  ArrowRight, Plus, RefreshCw, Inbox, Wallet, Hash,
} from "lucide-react";

type Order = {
  id: string; service: ServiceKey; action: ActionKey; price_inr: number;
  target: string; payment_method: "upi" | "usdt_bep20"; payment_reference: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes: string | null; created_at: string;
};

type OrderEvent = {
  id: string;
  order_id: string;
  status: Order["status"];
  message: string;
  created_at: string;
};

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard · BanLab" }] }),
});

const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};

const STATUS_ICON: Record<Order["status"], typeof Clock> = {
  pending: Clock,
  in_progress: Loader2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

const STATUS_DOT: Record<Order["status"], string> = {
  pending: "text-yellow-400",
  in_progress: "text-blue-400",
  completed: "text-emerald-400",
  cancelled: "text-red-400",
};

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [events, setEvents] = useState<Record<string, OrderEvent[]>>({});
  const [loadingEvents, setLoadingEvents] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth" }); else load();
    });
  }, [navigate]);

  async function load() {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setOrders((data ?? []) as Order[]);
  }

  async function loadEvents(orderId: string) {
    setLoadingEvents(orderId);
    const { data, error } = await supabase
      .from("order_events")
      .select("id, order_id, status, message, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    setLoadingEvents(null);
    if (error) return toast.error(error.message);
    setEvents((prev) => ({ ...prev, [orderId]: (data ?? []) as OrderEvent[] }));
  }

  function toggle(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!events[id]) loadEvents(id);
  }

  const stats = {
    total: orders?.length ?? 0,
    pending: orders?.filter((o) => o.status === "pending").length ?? 0,
    inProgress: orders?.filter((o) => o.status === "in_progress").length ?? 0,
    completed: orders?.filter((o) => o.status === "completed").length ?? 0,
    cancelled: orders?.filter((o) => o.status === "cancelled").length ?? 0,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-[11px] text-muted-foreground">Overview & recent orders</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="space-y-6 px-5 pt-5 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Package className="h-3.5 w-3.5 text-primary" /> Total Orders
            </div>
            <div className="mt-1 text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Completed
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-400">{stats.completed}</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-yellow-400" /> Pending
            </div>
            <div className="mt-1 text-2xl font-bold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 text-blue-400" /> In Progress
            </div>
            <div className="mt-1 text-2xl font-bold text-blue-400">{stats.inProgress}</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Link to="/" className="flex-1">
            <Button className="w-full bg-[var(--gradient-gold)] text-primary-foreground hover:opacity-90">
              <Plus className="mr-1 h-4 w-4" /> New order
            </Button>
          </Link>
          <Link to="/orders" className="flex-1">
            <Button variant="secondary" className="w-full">
              <ArrowRight className="mr-1 h-4 w-4" /> All orders
            </Button>
          </Link>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent Orders</h2>
            <Link to="/orders" className="text-[11px] font-medium text-primary">View all</Link>
          </div>

          {orders === null && <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Loading…</div>}
          {orders && orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-3 text-sm font-medium">No orders yet</div>
              <div className="mt-1 text-xs text-muted-foreground">Tap "New order" to get started.</div>
            </div>
          )}
          <div className="space-y-3">
            {orders?.map((o) => {
              const svc = SERVICES.find((s) => s.key === o.service)!;
              const isOpen = expanded === o.id;
              const tl = events[o.id];
              return (
                <div key={o.id} className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</div>
                      <div className="mt-1 text-base font-semibold">{svc.name} · {o.action.toUpperCase()}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">Target: <span className="font-mono text-foreground">{o.target}</span></div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">₹{o.price_inr.toLocaleString("en-IN")}</div>
                      <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] ${STATUS_STYLES[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>
                  </div>

                  {/* Payment Reference */}
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
                    <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-1/2">
                      <div className="text-[10px] text-muted-foreground">{o.payment_method === "upi" ? "UTR" : "Tx Hash"}</div>
                      <div className="font-mono text-[11px] text-foreground break-all">{o.payment_reference}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-[10px] text-muted-foreground">Method</div>
                      <div className="text-[11px] font-medium uppercase">{o.payment_method === "upi" ? "UPI" : "USDT"}</div>
                    </div>
                  </div>

                  {/* Timeline toggle */}
                  <button
                    onClick={() => toggle(o.id)}
                    className="mt-3 flex w-full items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs font-medium text-foreground/90 transition hover:bg-secondary/70"
                  >
                    <span className="flex items-center gap-2">
                      <CircleDot className="h-3.5 w-3.5 text-primary" />
                      {isOpen ? "Hide timeline" : "View timeline"}
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {/* Timeline */}
                  {isOpen && (
                    <div className="mt-3 rounded-xl border border-border/60 bg-background/40 p-4">
                      {loadingEvents === o.id && !tl && (
                        <div className="text-center text-xs text-muted-foreground">Loading timeline…</div>
                      )}
                      {tl && tl.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground">No events yet.</div>
                      )}
                      {tl && tl.length > 0 && (
                        <ol className="relative space-y-4 border-l border-border/60 pl-5">
                          {tl.map((e, i) => {
                            const Icon = STATUS_ICON[e.status];
                            const isLast = i === tl.length - 1;
                            return (
                              <li key={e.id} className="relative">
                                <span
                                  className={`absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full border border-border/70 bg-card ${STATUS_DOT[e.status]}`}
                                >
                                  <Icon className={`h-3 w-3 ${e.status === "in_progress" && isLast ? "animate-spin" : ""}`} />
                                </span>
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                                    {STATUS_LABEL[e.status]}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(e.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{e.message}</p>
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
