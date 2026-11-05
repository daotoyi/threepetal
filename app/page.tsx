import Link from "next/link";
import { Sprout, Flower2, Gamepad2, Palette } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Container, Button, Card } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero — 真实产品预览，非模板口号 */}
      <section className="bg-bg">
        <Container className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-pill bg-surface-warm px-3 py-1 text-xs font-medium text-fg-2">
              <Flower2 className="h-3.5 w-3.5 text-accent" strokeWidth={2} /> No ads. Ever.
            </span>
            <p className="font-display text-sm font-semibold text-accent">
              Three petals at a time.
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              A cozy puzzle garden you actually own.
            </h1>
            <p className="max-w-md text-fg-2">
              Threepetal is a calm match-three garden. Play the first chapter free,
              grow your space with petals, and unlock everything with one fair price —
              your progress saved in the cloud, forever.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/play">
                <Button>Play free</Button>
              </Link>
              <Link href="/unlock">
                <Button variant="outline">See pricing</Button>
              </Link>
            </div>
            <p className="text-xs text-meta">
              One-time purchase · VAT handled automatically · Cancel anytime by just
              not buying
            </p>
          </div>

          {/* 真实游戏预览卡片 */}
          <Card className="bg-surface-warm">
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold">Chapter 1 · First Sprout</span>
              <span className="flex items-center gap-1 font-mono text-sm text-accent">
                <Flower2 className="h-4 w-4" strokeWidth={2} /> 0
              </span>
            </div>
            <div
              className="mt-4 grid gap-1.5"
              style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
            >
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square w-full rounded-md"
                  style={{
                    backgroundColor: [
                      "var(--petal-1)",
                      "var(--petal-2)",
                      "var(--petal-3)",
                      "var(--petal-4)",
                      "var(--petal-5)",
                    ][(i * 3) % 5],
                  }}
                />
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              Swap adjacent petals to line up three of a kind. Calm, no timer, no ads.
            </p>
          </Card>
        </Container>
      </section>

      {/* How it works */}
      <section className="bg-surface">
        <Container className="grid gap-6 py-16 md:grid-cols-3">
          {[
            { Icon: Gamepad2, t: "Open & play", d: "No download, no app store. Tap and you're gardening." },
            { Icon: Flower2, t: "Match & grow", d: "Solve cozy puzzles to earn petals and decorate your space." },
            { Icon: Palette, t: "Own it", d: "One purchase unlocks everything. Your garden stays yours." },
          ].map(({ Icon, t, d }) => (
            <Card key={t}>
              <Icon className="h-6 w-6 text-accent" strokeWidth={2} />
              <h3 className="mt-3 font-display text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </Card>
          ))}
        </Container>
      </section>

      {/* 设计原则陈述：只写可兑现的产品事实，不使用虚构用户证言 */}
      <section className="bg-bg">
        <Container className="py-16">
          <h2 className="mb-8 text-center font-display text-2xl font-bold">
            How Threepetal is built
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "No interruptions", d: "No ads, no timers, and no pop-ups asking you to come back." },
              { t: "One fair price", d: "A single purchase unlocks every chapter and decoration. No subscription." },
              { t: "Yours to keep", d: "Cloud save keeps your garden waiting on any device you sign in from." },
            ].map(({ t, d }) => (
              <Card key={t} className="bg-surface">
                <h3 className="font-display text-base font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <SiteFooter />
    </div>
  );
}
