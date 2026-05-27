import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AlertCircle, Plus, RefreshCw, MessageSquare, CheckCircle2, XCircle, Clock, Search } from "lucide-react";

type CStatus = "open" | "in_review" | "resolved" | "rejected";
type CCategory = "order_issue" | "payment" | "delay" | "refund" | "account" | "other";

type Complaint = {
  id: string;
  user_id: string;
  order_id: string | null;
  category: CCategory;
  subject: string;
  description: string;
  status: CStatus;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

export const Route = createFileRoute("/complaints")({
  component: Complaints,
  head: () => ({ meta: [{ title: "Complaints · BanLab" }, { name: "description", content: "Raise a complaint and track its status." }] }),
});

const CATS: { key: CCategory; label: string }[] = [
  { key: "order_issue", label: "Order issue" },
  { key: "payment", label: "Payment problem" },
  { key: "delay", label: "Delay" },
  { key: "refund", label: "Refund request" },
  { key: "account", label: "Account issue" },
  { key: "other", label: "Other" },
];

const STATUS_META: Record<CStatus, { label: string; cls: string; Icon: typeof Clock }> = {
  open: { label: "Open", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30", Icon: Clock },
  in_review: { label: "In review", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30", Icon: Search },
  resolved: { label: "Resolved", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", Icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-red-500/15 text-red-300 border-red-500/30", Icon: XCircle },
};

function Complaints() {
  const navigate = useNavigate();
  const [list, setList] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: "order_issue" as CCategory, order_id: "", subject: "", description: "" });

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate({ to: "/auth" }); return; }
      await load();
    })();
  }, [navigate]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setList((data ?? []) as Complaint[]);
  }

  async function submit() {
    if (form.subject.trim().length < 4) return toast.error("Subject too short");
    if (form.description.trim().length < 10) return toast.error("Please describe the issue (min 10 chars)");
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSubmitting(false); return; }
    const { error } = await supabase.from("complaints").insert({
      user_id: u.user.id,
      category: form.category,
      order_id: form.order_id.trim() || null,
      subject: form.subject.trim(),
      description: form.description.trim(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Complaint submitted. We'll review it shortly.");
    setForm({ category: "order_issue", order_id: "", subject: "", description: "" });
    setOpen(false);
    load();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="border-b border-border/60 px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Complaints</h1>
          <p className="text-[11px] text-muted-foreground">Raise an issue and track the resolution</p>
        </div>
        <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </header>

      <main className="space-y-4 px-5 pt-5 pb-4">
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-[var(--gradient-gold)] px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <Plus className="h-4 w-4" /> File a new complaint
          </button>
        )}

        {open && (
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><AlertCircle className="h-4 w-4 text-primary" /> New complaint</div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as CCategory })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Order ID (optional)</label>
              <Input className="mt-1 font-mono text-xs" placeholder="Paste order ID if related"
                value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} maxLength={64} />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Subject</label>
              <Input className="mt-1" placeholder="Short title" value={form.subject} maxLength={120}
                onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Describe the problem</label>
              <Textarea className="mt-1 min-h-[110px]" placeholder="What happened? When? Any screenshots / refs?"
                value={form.description} maxLength={2000}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={submit} disabled={submitting} className="flex-1">{submitting ? "Submitting…" : "Submit complaint"}</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {loading && <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">Loading…</div>}
          {!loading && list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
              No complaints yet. Hope it stays that way.
            </div>
          )}
          {list.map((c) => {
            const meta = STATUS_META[c.status];
            const Icon = meta.Icon;
            const catLabel = CATS.find((x) => x.key === c.category)?.label ?? c.category;
            return (
              <div key={c.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">#{c.id.slice(0, 8)} · {new Date(c.created_at).toLocaleString()}</div>
                    <div className="mt-0.5 text-sm font-semibold leading-snug">{c.subject}</div>
                    <div className="text-[11px] text-muted-foreground">{catLabel}{c.order_id ? ` · order ${c.order_id.slice(0, 8)}` : ""}</div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${meta.cls}`}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{c.description}</p>
                {c.admin_response && (
                  <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-primary"><MessageSquare className="h-3 w-3" /> Reply from BanLab team</div>
                    <p className="mt-1 whitespace-pre-wrap text-xs">{c.admin_response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center text-[11px] text-muted-foreground">
          Need urgent help? <Link to="/support" className="text-primary underline">Open support</Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}