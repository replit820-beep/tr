import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { SUPPORT_WHATSAPP } from "@/lib/services";
import { MessageCircle, Phone, Clock, ShieldCheck, Copy, AlertCircle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({
  component: Support,
  head: () => ({ meta: [{ title: "Support · BanLab" }] }),
});

function Support() {
  const waLink = `https://wa.me/${SUPPORT_WHATSAPP.replace(/[^0-9]/g, "")}`;
  function copy() { navigator.clipboard.writeText(SUPPORT_WHATSAPP); toast.success("Number copied"); }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="border-b border-border/60 px-5 py-4">
        <h1 className="text-xl font-bold tracking-tight">Customer support</h1>
        <p className="text-[11px] text-muted-foreground">We're here 24/7</p>
      </header>

      <main className="space-y-4 px-5 pt-5">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-[var(--gradient-gold)] p-6 text-primary-foreground">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background/20">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-snug">Chat on WhatsApp</h2>
          <p className="mt-1 text-sm opacity-90">Average reply under 5 minutes.</p>
          <a href={waLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-background px-4 py-3 text-sm font-semibold text-foreground">
            <MessageCircle className="h-4 w-4 text-emerald-500" /> Open WhatsApp
          </a>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"><Phone className="h-4 w-4 text-primary" /></div>
              <div>
                <div className="text-xs text-muted-foreground">Support number</div>
                <div className="font-mono text-base font-semibold">{SUPPORT_WHATSAPP}</div>
              </div>
            </div>
            <button onClick={copy} className="rounded-full bg-secondary p-2 text-primary"><Copy className="h-4 w-4" /></button>
          </div>
        </div>

        <Link
          to="/complaints"
          className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-5 hover:border-primary/60 transition"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"><AlertCircle className="h-4 w-4 text-primary" /></div>
            <div>
              <div className="text-sm font-semibold">File a complaint</div>
              <div className="text-[11px] text-muted-foreground">Track status &amp; get a written reply</div>
            </div>
          </div>
          <span className="text-primary text-sm">Open →</span>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Info Icon={Clock} title="Response time" desc="< 5 minutes" />
          <Info Icon={ShieldCheck} title="Privacy" desc="Data never shared" />
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <h3 className="text-sm font-semibold">Common questions</h3>
          <div className="mt-3 space-y-3 text-sm">
            <Faq q="How long does an order take?" a="Most orders complete within 6–24 hours after payment confirmation." />
            <Faq q="Is my data safe?" a="Yes. Your details are only visible to our operators and never shared with third parties." />
            <Faq q="What if my order fails?" a="If we cannot deliver, you get a full refund — no questions asked. Reach us on WhatsApp." />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function Info({ Icon, title, desc }: { Icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <div className="text-[11px] text-muted-foreground">{desc}</div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-border/40 pb-2 last:border-0">
      <div className="text-sm font-medium">{q}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{a}</div>
    </div>
  );
}