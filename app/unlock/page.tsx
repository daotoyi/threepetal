"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock, Loader2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Container, Button, Card } from "@/components/ui";
import { createBrowserClient } from "@/lib/supabase/client";

export default function UnlockPage() {
  const [hasFullGame, setHasFullGame] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        try {
          const res = await fetch("/api/entitlements", { cache: "no-store" });
          const { entitlements } = await res.json();
          setHasFullGame(entitlements?.includes("full_game"));
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  const startCheckout = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Sign in first?");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError("Network error, please retry.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Container className="max-w-md py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-pill bg-surface-warm px-3 py-1 text-xs font-medium text-fg-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={2} /> One-time purchase
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold">Unlock Threepetal</h1>
          <p className="mt-2 text-sm text-muted">
            Everything, forever. No subscription, no ads, no catches.
          </p>
        </div>

        <Card className="mt-8">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg font-semibold">Full Game Unlock</span>
            <span className="font-display text-2xl font-bold text-accent">$4.99</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-fg-2">
            {[
              "All 6 chapters, including the three paid ones",
              "All 5 garden decorations",
              "Cloud save across devices",
              "No subscription and no in-app purchases",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" strokeWidth={2} /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            {hasFullGame ? (
              <div className="flex items-center justify-center gap-2 rounded-pill bg-success/10 px-4 py-2 text-sm font-semibold text-success">
                <Check className="h-4 w-4" strokeWidth={2} /> You own the full game
              </div>
            ) : loading ? (
              <Button disabled className="w-full">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> Loading…
              </Button>
            ) : (
              <Button onClick={startCheckout} disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> Redirecting…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" strokeWidth={2} /> Unlock for $4.99
                  </>
                )}
              </Button>
            )}
          </div>
          {error && <p className="mt-3 text-center text-xs text-danger">{error}</p>}
          <p className="mt-4 text-center text-xs text-meta">
            Secured by LemonSqueezy (Merchant of Record). VAT/GST calculated at checkout.
          </p>
        </Card>

        <p className="mt-6 text-center text-xs text-muted">
          Already bought it?{" "}
          <Link href="/account" className="font-semibold text-accent underline">
            Restore purchase
          </Link>{" "}
          from the account page.
        </p>
      </Container>
      <SiteFooter />
    </div>
  );
}
