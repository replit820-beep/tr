import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { LogOut, User as UserIcon, Mail, Phone, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Profile · BanLab" }] }),
});

function Profile() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate({ to: "/auth" }); return; }
      setEmail(s.session.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("display_name, whatsapp").eq("id", s.session.user.id).maybeSingle();
      if (p) { setName(p.display_name ?? ""); setWhatsapp(p.whatsapp ?? ""); }
    })();
  }, [navigate]);

  async function save() {
    setSaving(true);
    const { data: s } = await supabase.auth.getUser();
    if (!s.user) return;
    const { error } = await supabase.from("profiles").update({ display_name: name || null, whatsapp: whatsapp || null }).eq("id", s.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="border-b border-border/60 px-5 py-4">
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
        <p className="text-[11px] text-muted-foreground">Your account & contact details</p>
      </header>

      <main className="space-y-5 px-5 pt-5">
        <div className="rounded-2xl border border-border/70 bg-card p-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <UserIcon className="h-7 w-7" />
          </div>
          <div className="mt-3 text-base font-semibold">{name || email.split("@")[0]}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary">
            <BadgeCheck className="h-3 w-3" /> Verified account
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs"><Mail className="h-3 w-3" /> Email</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs"><Phone className="h-3 w-3" /> WhatsApp</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91…" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full bg-[var(--gradient-gold)] text-primary-foreground hover:opacity-90">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <Button onClick={logout} variant="secondary" className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}