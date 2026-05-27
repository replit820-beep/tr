import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { SERVICES, USDT_INR_RATE, inrToUsdt, type ServiceKey, type ActionKey } from "@/lib/services";
import {
  ShieldAlert, ShieldCheck,
  ArrowRight, Feather, Zap, Lock, Clock, BadgeCheck, ChevronRight,
  Wallet, MapPin, Truck,
} from "lucide-react";
import instagramLogo from "@/assets/services/instagram.png";
import facebookLogo from "@/assets/services/facebook.jpg";
import whatsappLogo from "@/assets/services/whatsapp.png";
import telegramLogo from "@/assets/services/telegram.png";
import xLogo from "@/assets/services/x.jpg";
import snapchatLogo from "@/assets/services/snapchat.jpg";
import linkedinLogo from "@/assets/services/linkedin.png";

const LOGOS: Record<ServiceKey, string> = {
  instagram: instagramLogo,
  facebook: facebookLogo,
  whatsapp: whatsappLogo,
  telegram: telegramLogo,
  x: xLogo,
  snapchat: snapchatLogo,
  linkedin: linkedinLogo,
};

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "BanLab — Premium Ban & Unban Services" },
      { name: "description", content: "Instagram, Facebook, WhatsApp & Telegram ban / unban — premium, secure, tracked." },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  function pickService(key: ServiceKey, action: ActionKey) {
    if (!authed) { navigate({ to: "/auth" }); return; }
    navigate({ to: "/order/new", search: { service: key, action } });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient premium backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
             style={{ background: "radial-gradient(circle, oklch(0.78 0.16 65 / 0.35), transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.06]"
             style={{ backgroundImage: "radial-gradient(oklch(0.97 0.01 80) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      </div>

      <header className="relative px-5 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-glow)]">
              <Feather className="h-5 w-5" />
            </span>
            <div>
              <div className="text-base font-bold tracking-tight">BanLab</div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <BadgeCheck className="h-3 w-3 text-primary" /> Verified operators
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
          </span>
        </div>
      </header>

      <section className="relative px-5 pt-10">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
          <span className="h-1 w-1 rounded-full bg-primary" />
          India's premium ban lab
          <span className="h-1 w-1 rounded-full bg-primary" />
        </div>

        <h1 className="mt-5 text-[44px] leading-[1.02] tracking-tight">
          <span className="block font-display italic text-foreground/95">Discreet.</span>
          <span className="block font-display italic gold-shimmer">Decisive.</span>
          <span className="mt-1 block font-sans-pro text-[26px] font-semibold tracking-tight text-foreground/90">
            Ban &amp; Unban, delivered.
          </span>
        </h1>

        {/* Gold rule */}
        <div className="mt-5 h-px w-24 bg-[var(--gradient-gold)] opacity-80" />

        <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          Hand-picked operators. End-to-end privacy. Pay via UPI or USDT and watch
          every step of your order in real time.
        </p>

        {/* Premium stat chips */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[
            { Icon: Zap, k: "6–24h", l: "Delivery" },
            { Icon: Lock, k: "100%", l: "Discreet" },
            { Icon: Clock, k: "Live", l: "Tracking" },
          ].map(({ Icon, k, l }) => (
            <div
              key={l}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/40 p-3 backdrop-blur"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <Icon className="h-4 w-4 text-primary" />
              <div className="mt-2 text-sm font-semibold tracking-tight">{k}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>

        {/* Live rate — premium ticker */}
        <div className="mt-5 flex items-center justify-between overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Live FX</span>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm font-semibold text-foreground">1 USDT = ₹{USDT_INR_RATE}</div>
            <div className="font-mono text-[10px] text-muted-foreground">INR ⇋ USDT · BEP20</div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="relative px-5 pt-6">
        <div className="flex items-center justify-center gap-3">
          {[
            { Icon: Wallet, label: "Secure payments", sub: "UPI / USDT" },
            { Icon: MapPin, label: "Live tracking", sub: "Real-time updates" },
            { Icon: Truck, label: "Fast delivery", sub: "6–24 hours" },
          ].map(({ Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card/70 px-3 py-3.5 text-center backdrop-blur transition hover:border-primary/30"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-[11px] font-semibold leading-tight tracking-tight">{label}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative px-5 pt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Choose a service</h2>
          <span className="text-[11px] text-muted-foreground">Tap to order</span>
        </div>

        <div className="space-y-3">
          {SERVICES.map((s) => {
            const logo = LOGOS[s.key];
            return (
              <div key={s.key} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                <div className="flex items-center gap-3 px-4 pt-4">
                  <img src={logo} alt={`${s.name} logo`} className="h-11 w-11 rounded-xl object-cover shadow-md" />
                  <div className="flex-1">
                    <div className="text-base font-semibold">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">Ban or unban — verified result</div>
                  </div>
                </div>
                <div className={`grid gap-2 p-3 ${s.unbanOnly ? "grid-cols-1" : "grid-cols-2"}`}>
                  {!s.unbanOnly && (
                  <button
                    onClick={() => pickService(s.key, "ban")}
                    className="group flex items-center justify-between rounded-xl border border-border/70 bg-secondary/40 px-3 py-3 text-left transition hover:border-destructive/50"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-destructive">
                        <ShieldAlert className="h-3 w-3" /> Ban
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-semibold">₹{s.prices.ban.toLocaleString("en-IN")}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{inrToUsdt(s.prices.ban)} USDT</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </button>
                  )}
                  <button
                    onClick={() => pickService(s.key, "unban")}
                    className="group flex items-center justify-between rounded-xl border border-border/70 bg-secondary/40 px-3 py-3 text-left transition hover:border-primary/50"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-primary">
                        <ShieldCheck className="h-3 w-3" /> Unban
                      </div>
                      <div className="mt-0.5 font-mono text-sm font-semibold">₹{s.prices.unban.toLocaleString("en-IN")}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{inrToUsdt(s.prices.unban)} USDT</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative px-5 pb-28 pt-8">
        <div className="rounded-2xl border border-primary/40 bg-[var(--gradient-gold)] p-5 text-white shadow-lg">
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/90">Why BanLab</div>
          <div className="mt-2 text-lg font-extrabold leading-snug text-white">Trusted by hundreds. Discreet, fast, refundable if undelivered.</div>
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white">
            Start an order <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}