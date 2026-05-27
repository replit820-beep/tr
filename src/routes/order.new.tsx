import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  SERVICES, priceFor, type ServiceKey, type ActionKey,
  UPI_ID, USDT_BEP20, USDT_INR_RATE, inrToUsdt,
} from "@/lib/services";
import upiQr from "@/assets/upi-qr.jpg";
import { ArrowLeft, Copy, ShieldAlert, ShieldCheck, CheckCircle2, Wallet, QrCode, LinkIcon } from "lucide-react";

const searchSchema = z.object({
  service: z.enum(["instagram", "facebook", "whatsapp", "telegram", "x", "snapchat", "linkedin"]).catch("instagram"),
  action: z.enum(["ban", "unban"]).catch("ban"),
});

export const Route = createFileRoute("/order/new")({
  validateSearch: searchSchema,
  component: NewOrder,
  head: () => ({ meta: [{ title: "New order · BanLab" }] }),
});

const formSchema = z.object({
  target: z.string().trim().min(2).max(200),
  payment_reference: z.string().trim().min(6).max(200),
});

function NewOrder() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [service] = useState<ServiceKey>(search.service);
  const [action] = useState<ActionKey>(search.action);
  const [target, setTarget] = useState("");
  const [payment, setPayment] = useState<"upi" | "usdt_bep20">("upi");
  const [ref, setRef] = useState("");
  const [refConfirmed, setRefConfirmed] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const svc = useMemo(() => SERVICES.find((s) => s.key === service)!, [service]);
  const price = priceFor(service, action);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (!data.session) navigate({ to: "/auth" }); });
  }, [navigate]);

  function next1() {
    if (target.trim().length < 2) return toast.error("Enter the target ID / link");
    setStep(2);
  }

  function copy(v: string, l: string) { navigator.clipboard.writeText(v); toast.success(`${l} copied`); }

  async function confirmAndPlace() {
    const v = ref.trim();
    if (v.length < 6) return toast.error("Enter a valid UTR / transaction hash");
    if (payment === "upi" && !/^[a-zA-Z0-9]{10,}$/.test(v)) return toast.error("UTR usually 12 digits");
    if (payment === "usdt_bep20" && !/^0x[a-fA-F0-9]{10,}$/.test(v)) return toast.error("Hash should start with 0x");
    if (!acceptedTerms) return toast.error("Please accept the Terms & Refund Policy to continue");
    const parsed = formSchema.safeParse({ target, payment_reference: v });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSubmitting(false); return toast.error("Sign in required"); }
    const { error } = await supabase.from("orders").insert({
      user_id: u.user.id,
      service, action, price_inr: price,
      target: parsed.data.target,
      payment_method: payment,
      payment_reference: parsed.data.payment_reference,
      status: "pending",
      notes: null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setRefConfirmed(true);
    toast.success("Order placed — pending");
    navigate({ to: "/orders" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur">
        <button onClick={() => (step === 1 ? navigate({ to: "/" }) : setStep(1))} className="grid h-9 w-9 place-items-center rounded-full bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Step {step} of 2</div>
          <div className="text-sm font-semibold">{step === 1 ? "Profile link" : "Pay & confirm"}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-base font-semibold text-primary">₹{price.toLocaleString("en-IN")}</div>
          <div className="font-mono text-[10px] text-muted-foreground">{inrToUsdt(price)} USDT</div>
        </div>
      </header>

      <div className="mx-auto h-1 max-w-md bg-secondary">
        <div className="h-full bg-[var(--gradient-gold)] transition-all" style={{ width: `${(step / 2) * 100}%` }} />
      </div>

      <main className="px-5 pb-10 pt-6">
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
          <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${svc.accent} text-white`}>
            {action === "ban" ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{svc.name} · {action.toUpperCase()}</div>
            <div className="text-xs text-muted-foreground">Avg. delivery 6–24 hours</div>
          </div>
        </div>

        {step === 1 && (
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Profile / Username link</Label>
              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") next1(); }}
                  autoFocus
                  className="h-12 pl-9 text-sm"
                  placeholder={
                    service === "instagram" ? "@username or instagram.com/username" :
                    service === "facebook" ? "facebook.com/profile-or-page" :
                    service === "whatsapp" ? "+91 phone number" :
                    "@channel or t.me/channel"
                  }
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Bas profile/channel ka link ya username paste karo.</p>
            </div>

            <Button onClick={next1} className="w-full bg-[var(--gradient-gold)] text-primary-foreground hover:opacity-90">
              Continue to payment
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-secondary/30 px-4 py-3 text-xs">
              <div className="text-muted-foreground">Target</div>
              <div className="mt-0.5 break-all font-mono text-sm text-foreground">{target}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPayment("upi")}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition ${payment === "upi" ? "border-primary bg-primary/10" : "border-border/70 bg-card"}`}
              >
                <QrCode className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-semibold">UPI</div>
                  <div className="text-[11px] text-muted-foreground">QR / ID</div>
                </div>
              </button>
              <button
                onClick={() => setPayment("usdt_bep20")}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition ${payment === "usdt_bep20" ? "border-primary bg-primary/10" : "border-border/70 bg-card"}`}
              >
                <Wallet className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-semibold">USDT</div>
                  <div className="text-[11px] text-muted-foreground">BEP20</div>
                </div>
              </button>
            </div>

            {payment === "upi" ? (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="text-center text-xs text-muted-foreground">Scan with any UPI app</div>
                <img src={upiQr} alt="UPI QR" className="mx-auto mt-3 w-48 rounded-2xl" />
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-2.5">
                  <span className="truncate font-mono text-xs">{UPI_ID}</span>
                  <button onClick={() => copy(UPI_ID, "UPI ID")} className="text-primary"><Copy className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
                  Pay exactly <span className="font-mono text-foreground">₹{price.toLocaleString("en-IN")}</span> and paste the UTR number below.
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="text-xs text-muted-foreground">USDT (BNB Smart Chain · BEP20)</div>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-2.5">
                  <span className="break-all font-mono text-xs">{USDT_BEP20}</span>
                  <button onClick={() => copy(USDT_BEP20, "USDT address")} className="shrink-0 text-primary"><Copy className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
                  Send <span className="font-mono text-foreground">{inrToUsdt(price)} USDT</span> (≈ ₹{price.toLocaleString("en-IN")}) and paste the transaction hash below.
                  <div className="mt-1 text-[10px]">Rate: 1 USDT ≈ ₹{USDT_INR_RATE}</div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">{payment === "upi" ? "UTR number" : "Transaction hash"}</Label>
              <Input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder={payment === "upi" ? "12-digit UTR" : "0x…"}
                className="w-full"
              />
              <p className="text-[11px] text-muted-foreground">
                UTR / hash dalo aur niche confirm karte hi order place ho jayega.
              </p>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left">
              <Checkbox
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
                className="mt-0.5"
              />
              <span className="text-[12px] leading-relaxed text-muted-foreground">
                Maine{" "}
                <Link to="/terms" target="_blank" className="font-medium text-primary underline underline-offset-2">
                  Terms & Refund Policy
                </Link>{" "}
                padhi aur accept kar li hai.
              </span>
            </label>

            <Button onClick={confirmAndPlace} disabled={submitting || !acceptedTerms} className="w-full bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 shadow-lg">
              <CheckCircle2 className="mr-1 h-4 w-4" /> {submitting ? "Placing…" : `Confirm`}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Order place hone ke baad pending orders me dikhega.
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
