import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, ShieldCheck, RefreshCcw, AlertTriangle, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms & Refund Policy · BanLab" },
      { name: "description", content: "Service terms, refund and cancellation policy for BanLab orders." },
    ],
  }),
});

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur">
        <Link to="/" className="grid h-9 w-9 place-items-center rounded-full bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Legal</div>
          <div className="text-sm font-semibold">Terms & Refund Policy</div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-5 pb-28 pt-5">
        <div className="rounded-2xl border border-primary/30 bg-[var(--gradient-gold)]/10 p-4">
          <div className="text-xs uppercase tracking-wider text-primary">Important</div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Order place karne se pehle ye terms padhna zaroori hai. Order confirm karte hi aap in sab terms ko accept maan liye jate ho.
          </p>
        </div>

        <Section icon={FileText} title="Service Terms">
          <p>BanLab Instagram, Facebook, WhatsApp aur Telegram ke liye ban / unban assistance provide karta hai. Service paid hai aur har order manually process hota hai.</p>
          <p>Aap confirm karte ho ki jis account / channel ka link ya ID aap submit kar rahe ho uska use karne ka aapke paas valid reason hai. Personal disputes, harassment ya illegal use ke liye service use karna strictly prohibited hai.</p>
          <p>BanLab kisi bhi platform (Meta, WhatsApp, Telegram) se officially affiliated nahi hai.</p>
        </Section>

        <Section icon={Clock} title="Delivery Timeline">
          <p>Average delivery 6–24 hours hai. Kuch cases me platform ke moderation queue ki wajah se 72 hours tak lag sakte hain.</p>
          <p>Order ka live status aap “Orders” tab me track kar sakte ho.</p>
        </Section>

        <Section icon={RefreshCcw} title="Refund & Cancellation Policy">
          <p><span className="font-medium text-foreground">Cancellation:</span> Order tabhi cancel ho sakta hai jab uska status “Pending” ho aur kaam start na hua ho. Status “In progress” hone ke baad cancellation possible nahi.</p>
          <p><span className="font-medium text-foreground">Refund eligible:</span> Agar 72 hours me kaam complete na ho paye aur cancel kar diya jaye, to 100% refund usi payment method me wapas kiya jata hai (UPI 24h, USDT BEP20 24–48h).</p>
          <p><span className="font-medium text-foreground">Refund NOT eligible:</span> Galat ID / link submit karna, target account already banned / deleted hona, ya order successfully complete hone ke baad mind change karna — in cases me refund nahi milta.</p>
          <p><span className="font-medium text-foreground">Partial refund:</span> Agar order partially deliver hua to remaining amount ka pro-rata refund kiya jata hai.</p>
        </Section>

        <Section icon={AlertTriangle} title="Payment & Disputes">
          <p>Sirf displayed UPI ID aur USDT BEP20 address par hi payment kare. Kisi aur ID/address pe bheja gaya payment recover nahi ho sakta.</p>
          <p>Payment ke baad sahi UTR / transaction hash dalna mandatory hai. Galat reference se order verify nahi hoga.</p>
          <p>Chargeback ya payment reversal initiate karne par account permanently suspend kar diya jata hai.</p>
        </Section>

        <Section icon={ShieldCheck} title="Privacy & Liability">
          <p>Aapki submitted details (target ID, payment reference) sirf order fulfillment ke liye use hoti hain.</p>
          <p>BanLab ki maximum liability kisi bhi single order ki paid amount tak hi seemit hai. Indirect ya consequential losses ke liye liable nahi.</p>
        </Section>

        <p className="text-center text-[11px] text-muted-foreground">
          Questions? Support: <a href="https://wa.me/919278095923" className="text-primary">+91 9278095923</a>
        </p>
      </main>

      <BottomNav />
    </div>
  );
}