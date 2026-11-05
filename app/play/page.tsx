"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sprout, Lock, Info } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Container, Button } from "@/components/ui";
import { GameCanvas, type GameSave } from "@/components/GameCanvas";
import { DecorationPanel } from "@/components/DecorationPanel";
import { createBrowserClient } from "@/lib/supabase/client";
import { LEVELS, FREE_LEVELS, PAID_LEVELS } from "@/lib/game/levels";
import type { Level } from "@/lib/game/types";

const EMPTY_SAVE: GameSave = { petals: 0, highestLevel: 0, unlockedDecorations: [] };

export default function PlayPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [hasFullGame, setHasFullGame] = useState(false);
  const [save, setSave] = useState<GameSave>(EMPTY_SAVE);
  const [activeLevel, setActiveLevel] = useState<Level>(FREE_LEVELS[0]);
  const [loading, setLoading] = useState(true);

  const loadEntitlements = async () => {
    try {
      const res = await fetch("/api/entitlements", { cache: "no-store" });
      if (res.ok) {
        const { entitlements } = await res.json();
        setHasFullGame(entitlements?.includes("full_game"));
      }
    } catch {
      /* ignore */
    }
  };

  const loadProgress = async () => {
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const sd = data?.save_data ?? {};
        setSave({
          petals: data?.petals ?? 0,
          highestLevel: data?.level ?? 0,
          unlockedDecorations: sd.unlockedDecorations ?? [],
        });
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setUser(s ? { id: s.user.id, email: s.user.email } : null);
      if (s) {
        loadEntitlements();
        loadProgress();
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session ? { id: session.user.id, email: session.user.email } : null);
      if (session) {
        loadEntitlements();
        loadProgress();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const persist = async (next: Partial<GameSave>) => {
    setSave((prev) => ({ ...prev, ...next }));
    if (!user) return;
    await fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petals: next.petals ?? save.petals,
        level: next.highestLevel ?? save.highestLevel,
        save_data: { unlockedDecorations: next.unlockedDecorations ?? save.unlockedDecorations },
      }),
    }).catch(() => {});
  };

  const buyDecoration = (id: string, cost: number) => {
    if (save.petals < cost || save.unlockedDecorations.includes(id)) return;
    persist({
      petals: save.petals - cost,
      unlockedDecorations: [...save.unlockedDecorations, id],
    });
  };

  const selectLevel = (lvl: Level) => {
    const locked = !lvl.free && !hasFullGame;
    setActiveLevel(lvl);
    if (locked) return;
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-display text-2xl font-bold">Play</h1>
              <p className="text-sm text-muted">Swap petals, line up three, grow your garden.</p>
            </div>

            {!user && (
              <div className="flex items-center gap-3 rounded-md border border-border bg-surface-warm p-3 text-sm text-fg-2">
                <Info className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                <span>
                  Playing without an account — progress won&apos;t be saved.{" "}
                  <Link href="/account" className="font-semibold text-accent underline">
                    Sign in
                  </Link>{" "}
                  to keep it in the cloud.
                </span>
              </div>
            )}

            {/* 关卡选择 */}
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => {
                const locked = !lvl.free && !hasFullGame;
                const active = lvl.id === activeLevel.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => selectLevel(lvl)}
                    className={`flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-accent bg-accent text-accent-on"
                        : "border-border bg-surface text-fg-2 hover:bg-surface-warm"
                    }`}
                  >
                    {locked && <Lock className="h-3.5 w-3.5" strokeWidth={2} />}
                    {lvl.id}. {lvl.title}
                  </button>
                );
              })}
            </div>

            <GameCanvas
              key={activeLevel.id}
              level={activeLevel}
              initialPetals={save.petals}
              initialHighest={save.highestLevel}
              locked={!activeLevel.free && !hasFullGame}
              onUnlockCta={() => (window.location.href = "/unlock")}
              onSave={persist}
            />
          </div>

          <aside className="flex flex-col gap-4">
            <DecorationPanel
              petals={save.petals}
              unlocked={save.unlockedDecorations}
              onBuy={buyDecoration}
            />
            {!hasFullGame && (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm">
                <p className="font-semibold text-fg">Unlock the full garden</p>
                <p className="mt-1 text-muted">
                  {FREE_LEVELS.length} free chapters played. One purchase unlocks all{" "}
                  {LEVELS.length} + cloud save.
                </p>
                <Link href="/unlock" className="mt-3 inline-block">
                  <Button size="sm">Unlock — $4.99</Button>
                </Link>
              </div>
            )}
          </aside>
        </div>
      </Container>
      <SiteFooter />
    </div>
  );
}
