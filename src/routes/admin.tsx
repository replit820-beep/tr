import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SERVICES, type ServiceKey, type ActionKey } from "@/lib/services";
import { RefreshCw, Trash2, ShieldCheck, MessageSquarePlus, Send, AlertCircle, Reply } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type Status = "waiting_for_approval" | "approved" | "pending" | "in_progress" | "completed" | "cancelled";
type CStatus = "open" | "in_review" | "resolved" | "rejected";

type Complaint = {
  id: string;
  user_id: string;
  order_id: string | null;
  category: string;
  subject: string;
  description: string;
  status: CStatus;
  admin_response: string | null;
  created_at: string;
};

type Order = {
  id: string;
  user_id: string;
  service: ServiceKey;
  action: ActionKey;
  price_inr: number;
  target: string;
  payment_method: "upi" | "usdt_bep20";
  payment_reference: string;
  status: Status;
  notes: string | null;
  created_at: string;
};

type Profile = { id: string; display_name: string | null; whatsapp: string | null };

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({ meta: [{ title: "Admin · BanLab" }, { name: "description", content: "Admin order management." }] }),
});

const STATUSES: Status[] = ["waiting_for_approval", "approved", "pending", "in_progress", "completed", "cancelled"];

const STATUS_STYLES: Record<Status, string> = {
  waiting_for_approval: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  approved: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};
const C_STATUSES: CStatus[] = ["open", "in_review", "resolved", "rejected"];
const C_STATUS_STYLES: Record<CStatus, string> = {
  open: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  in_review: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  resolved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
};

function Admin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "complaints">("orders");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [savingC, setSavingC] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { navigate({ to: "/auth" }); return; }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.session.user.id)
        .eq("role", "admin");
      const admin = (roles ?? []).length > 0;
      setIsAdmin(admin);
      setChecking(false);
      if (admin) load();
    })();
  }, [navigate]);

  async function load() {
    const { data: o, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    const ords = (o ?? []) as Order[];
    setOrders(ords);
    const { data: cs } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
    const comps = (cs ?? []) as Complaint[];
    setComplaints(comps);
    const ids = Array.from(new Set([...ords.map((x) => x.user_id), ...comps.map((x) => x.user_id)]));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, display_name, whatsapp").in("id", ids);
      const map: Record<string, Profile> = {};
      (p ?? []).forEach((x) => (map[(x as Profile).id] = x as Profile));
      setProfiles(map);
    }
  }

  async function setStatus(id: string, status: Status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success("Status updated");
  }

  async function remove(id: string) {
    if (!confirm("Delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("Order deleted");
  }

  async function postNote(o: Order) {
    const msg = (noteDraft[o.id] ?? "").trim();
    if (msg.length < 2) return toast.error("Write a short update");
    setPosting(o.id);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("order_events").insert({
      order_id: o.id,
      status: o.status,
      message: msg,
      created_by: u.user?.id ?? null,
    });
    setPosting(null);
    if (error) return toast.error(error.message);
    setNoteDraft((p) => ({ ...p, [o.id]: "" }));
    toast.success("Update posted to timeline");
  }

  async function setComplaintStatus(id: string, status: CStatus) {
    const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    toast.success("Status updated");
  }

  async function saveReply(c: Complaint) {
    const msg = (replyDraft[c.id] ?? c.admin_response ?? "").trim();
    if (msg.length < 2) return toast.error("Write a reply");
    setSavingC(c.id);
    const { error } = await supabase.from("complaints").update({ admin_response: msg, status: c.status === "open" ? "in_review" : c.status }).eq("id", c.id);
    setSavingC(null);
    if (error) return toast.error(error.message);
    setComplaints((prev) => prev.map((x) => (x.id === c.id ? { ...x, admin_response: msg, status: x.status === "open" ? "in_review" : x.status } : x)));
    toast.success("Reply sent to customer");
  }

  async function removeComplaint(id: string) {
    if (!confirm("Delete this complaint?")) return;
    const { error } = await supabase.from("complaints").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setComplaints((prev) => prev.filter((c) => c.id !== id));
  }

  const counts = useMemo(() => {
    const c: Record<Status, number> = { waiting_for_approval: 0, approved: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => (c[o.status] += 1));
    return c;
  }, [orders]);

  const openComplaintCount = complaints.filter((c) => c.status === "open" || c.status === "in_review").length;

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (checking) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <BottomNav />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-muted-foreground">Checking access…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Toaster />
        <BottomNav />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Admin only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have admin access. Sign out and log in with the admin email.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              Sign out & login as admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <BottomNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order management</h1>
            <p className="text-sm text-muted-foreground">Review and update every customer order.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>

        <div className="mt-4 inline-flex rounded-xl border border-border/70 bg-card p-1 text-sm">
          <button onClick={() => setTab("orders")} className={`px-4 py-1.5 rounded-lg ${tab === "orders" ? "bg-secondary font-semibold" : "text-muted-foreground"}`}>Orders ({orders.length})</button>
          <button onClick={() => setTab("complaints")} className={`px-4 py-1.5 rounded-lg flex items-center gap-2 ${tab === "complaints" ? "bg-secondary font-semibold" : "text-muted-foreground"}`}>
            <AlertCircle className="h-3.5 w-3.5" /> Complaints
            {openComplaintCount > 0 && <span className="rounded-full bg-yellow-500/20 text-yellow-300 px-1.5 text-[10px]">{openComplaintCount}</span>}
          </button>
        </div>

        {tab === "orders" && (
        <>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-2xl border bg-card p-4 text-left transition ${filter === s ? "border-primary" : "border-border/70"}`}
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.replace("_", " ")}</div>
              <div className="mt-1 text-2xl font-bold">{counts[s]}</div>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Button variant={filter === "all" ? "default" : "ghost"} size="sm" onClick={() => setFilter("all")}>
            Show all ({orders.length})
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
              No orders in this view.
            </div>
          )}
          {filtered.map((o) => {
            const svc = SERVICES.find((s) => s.key === o.service)!;
            const p = profiles[o.user_id];
            return (
              <div key={o.id} className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {svc.name} <span className="text-muted-foreground">·</span> {o.action.toUpperCase()}
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="text-muted-foreground">Customer:</span>{" "}
                      <span className="font-medium">{p?.display_name ?? o.user_id.slice(0, 8)}</span>
                      {p?.whatsapp && <span className="text-muted-foreground"> · {p.whatsapp}</span>}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Target: <span className="font-mono text-foreground break-all">{o.target}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg">₹{o.price_inr.toLocaleString("en-IN")}</div>
                    <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[o.status]}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <div className="rounded-lg bg-secondary/60 px-3 py-2">
                    Payment: <span className="text-foreground">{o.payment_method === "upi" ? "UPI" : "USDT BEP20"}</span>
                  </div>
                  <div className="rounded-lg bg-secondary/60 px-3 py-2 truncate">
                    {o.payment_method === "upi" ? "UTR" : "Tx Hash"}:{" "}
                    <span className="font-mono text-foreground">{o.payment_reference}</span>
                  </div>
                </div>
                {o.notes && <div className="mt-2 text-xs text-muted-foreground">Note: {o.notes}</div>}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Select value={o.status} onValueChange={(v) => setStatus(o.id, v as Status)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => remove(o.id)} className="text-destructive">
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5">
                  <MessageSquarePlus className="ml-1 h-4 w-4 text-primary" />
                  <Input
                    value={noteDraft[o.id] ?? ""}
                    onChange={(e) => setNoteDraft((p) => ({ ...p, [o.id]: e.target.value }))}
                    placeholder="Post a timeline update for the customer…"
                    className="h-8 border-0 bg-transparent px-1 text-sm focus-visible:ring-0"
                    onKeyDown={(e) => { if (e.key === "Enter") postNote(o); }}
                  />
                  <Button size="sm" variant="ghost" disabled={posting === o.id} onClick={() => postNote(o)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}

        {tab === "complaints" && (
          <div className="mt-6 space-y-3">
            {complaints.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
                No complaints filed.
              </div>
            )}
            {complaints.map((c) => {
              const p = profiles[c.user_id];
              return (
                <div key={c.id} className="rounded-2xl border border-border/70 bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">#{c.id.slice(0, 8)} · {new Date(c.created_at).toLocaleString()} · {c.category.replace("_", " ")}</div>
                      <div className="mt-1 text-lg font-semibold">{c.subject}</div>
                      <div className="mt-1 text-sm">
                        <span className="text-muted-foreground">From:</span>{" "}
                        <span className="font-medium">{p?.display_name ?? c.user_id.slice(0, 8)}</span>
                        {p?.whatsapp && <span className="text-muted-foreground"> · {p.whatsapp}</span>}
                        {c.order_id && <span className="text-muted-foreground"> · order {c.order_id.slice(0, 8)}</span>}
                      </div>
                    </div>
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${C_STATUS_STYLES[c.status]}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 text-sm">{c.description}</p>

                  <div className="mt-3">
                    <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Reply to customer</label>
                    <Textarea
                      className="mt-1 min-h-[80px] text-sm"
                      placeholder="Visible to the customer in their complaints page…"
                      defaultValue={c.admin_response ?? ""}
                      onChange={(e) => setReplyDraft((p) => ({ ...p, [c.id]: e.target.value }))}
                      maxLength={2000}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Select value={c.status} onValueChange={(v) => setComplaintStatus(c.id, v as CStatus)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {C_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" disabled={savingC === c.id} onClick={() => saveReply(c)}>
                      <Reply className="mr-1 h-4 w-4" /> {savingC === c.id ? "Saving…" : "Send reply"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeComplaint(c.id)} className="text-destructive">
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
