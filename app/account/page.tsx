"use client";

import { useEffect, useState } from "react";
import { LogOut, Mail, RefreshCw, Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Container, Button, Card } from "@/components/ui";
import { createBrowserClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const refreshEntitlements = async () => {
    try {
      const res = await fetch("/api/entitlements", { cache: "no-store" });
      const { entitlements } = await res.json();
      setEntitlements(entitlements ?? []);
    } catch {}
  };

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session ? { email: data.session.user.email } : null);
      if (data.session) refreshEntitlements();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session ? { email: session.user.email } : null);
      if (session) refreshEntitlements();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (!email) return;
    const supabase = createBrowserClient();
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    setBusy(false);
    if (error) setMsg(error.message);
    else setSent(true);
  };

  const signOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setEntitlements([]);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Container className="max-w-md py-16">
        <h1 className="font-display text-3xl font-bold">Account</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to save progress and restore purchases.
        </p>

        {user ? (
          <Card className="mt-8">
            <p className="text-sm text-fg-2">Signed in as</p>
            <p className="font-medium">{user.email}</p>

            <div className="mt-5">
              <p className="text-sm font-semibold">Owned</p>
              {entitlements.length === 0 ? (
                <p className="mt-1 text-sm text-muted">No purchases yet.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {entitlements.map((e) => (
                    <li key={e} className="flex items-center gap-2 text-sm text-success">
                      <Check className="h-4 w-4" strokeWidth={2} /> {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={refreshEntitlements}>
                <RefreshCw className="h-4 w-4" strokeWidth={2} /> Restore
              </Button>
              <Button variant="ghost" onClick={signOut}>
                <LogOut className="h-4 w-4" strokeWidth={2} /> Sign out
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="mt-8">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 text-accent" strokeWidth={2} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-md border border-border bg-surface-sunken px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <Button onClick={signIn} disabled={busy || !email} className="mt-4 w-full">
              {busy ? "Sending…" : "Send magic link"}
            </Button>
            {sent && (
              <p className="mt-3 text-xs text-success">
                Check your inbox for a sign-in link.
              </p>
            )}
            {msg && <p className="mt-3 text-xs text-danger">{msg}</p>}
            <p className="mt-4 text-xs text-meta">
              We use a magic link — no password to remember.
            </p>
          </Card>
        )}
      </Container>
      <SiteFooter />
    </div>
  );
}
