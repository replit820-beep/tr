import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SERVICES, type ServiceKey, type ActionKey } from "@/lib/services";
import { Plus, RefreshCw, Inbox, ChevronDown, ChevronUp, Clock, CheckCircle2, Loader2, XCircle, CircleDot, Hourglass, ThumbsUp } from "lucide-react";

type Order = {
  id: string; service: ServiceKey; action: ActionKey; price_inr: number;
  target: string; payment_method: "upi" | "usdt_bep20"; payment_reference: string;
  status: "waiting_for_approval" | "approved" | "pending" | "in_progress" | "completed" | "cancelled";
  notes: string | null; created_at: string;
};

type OrderEvent = {
  id: string;
  order_id: string;
  status: Order["status"];
  message: string;
  created_at: string;
};

export const Route = createFileRoute("/orders")({
  component: Orders,
  head: () => ({ meta: [{ title: "My Orders · BanLab" }] }),
});

const STATUS_STYLES: Record<Order["status"], string> = {
  waiting_for_approval: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  approved: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};

const STATUS_ICON: Record<Order["status"], typeof Clock> = {
  waiting_for_approval: Hourglass,
  approved: ThumbsUp,
  pending: Clock,
  in_progress: Loader2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

const STATUS_DOT: Record<Order["status"], string> = {
  waiting_for_approval: "text-orange-400",
  approved: "text-purple-400",
  pending: "text-yellow-400",
  in_progress: "text-blue-400",
  completed: "text-emerald-400",
  cancelled: "text-red-400",
};

function Orders() {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">My orders</h1>
            <p className="text-[11px] text-muted-foreground">Track every request</p>
          </div>
          <Button variant="secondary" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="px-5 pt-5">
        <Link to="/">
          <Button className="w-full bg-[var(--gradient-gold)] text-primary-foreground hover:opacity-90">
            <Plus className="mr-1 h-4 w-4" /> Place new order
          </Button>
        </Link>

        <div className="mt-5 space-y-3">
          {orders === null && <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Loading…</div>}
          {orders && orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-3 text-sm font-medium">No orders yet</div>
              <div className="mt-1 text-xs text-muted-foreground">Tap "Place new order" to start.</div>
            </div>
          )}
          {orders?.map((o) => {
            const svc = SERVICES.find((s) => s.key === o.service)!;
            const isOpen = expanded === o.id;
            const tl = events[o.id];
            return (
              <div key={o.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}</div>
                    <div className="mt-1 text-base font-semibold">{svc.name} · {o.action.toUpperCase()}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">Target: <span className="font-mono text-foreground">{o.target}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">₹{o.price_inr.toLocaleString("en-IN")}</div>
                    <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] ${STATUS_STYLES[o.status]}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-[11px] text-muted-foreground">
                  {o.payment_method === "upi" ? "UTR" : "Tx Hash"}: <span className="font-mono text-foreground break-all">{o.payment_reference}</span>
                </div>

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
                                  {e.status.replace("_", " ")}
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
      </main>

      <BottomNav />
    </div>
  );
}
