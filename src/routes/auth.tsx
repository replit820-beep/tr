import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Feather } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in · BanLab" }, { name: "description", content: "Sign in to place and track ban / unban orders." }] }),
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/orders" });
    });
  }, [navigate]);

  async function signIn(email: string, password: string) {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    const uid = data.user?.id;
    if (uid) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin");
      if ((roles ?? []).length > 0) {
        navigate({ to: "/admin" });
        return;
      }
    }
    navigate({ to: "/dashboard" });
  }

  async function signUp(email: string, password: string) {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/orders` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    navigate({ to: "/orders" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-10">
        <Link to="/" className="flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gradient-gold)] text-primary-foreground">
            <Feather className="h-4 w-4" />
          </span>
          BanLab
        </Link>

        <div className="mt-12 rounded-3xl border border-border/70 bg-card p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to place orders and track delivery.</p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><AuthForm submit={signIn} loading={loading} cta="Continue" /></TabsContent>
            <TabsContent value="signup"><AuthForm submit={signUp} loading={loading} cta="Continue" /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AuthForm({ submit, loading, cta }: { submit: (e: string, p: string) => void; loading: boolean; cta: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      className="space-y-4 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        const er = emailSchema.safeParse(email);
        if (!er.success) return toast.error("Invalid email");
        const pr = passwordSchema.safeParse(password);
        if (!pr.success) return toast.error("Password must be 6–72 chars");
        submit(email, password);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button disabled={loading} type="submit" className="w-full bg-white text-black font-semibold hover:bg-white/90 shadow-lg">
        {loading ? "Please wait…" : cta}
      </Button>
    </form>
  );
}