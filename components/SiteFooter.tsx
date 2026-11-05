import { Container } from "./ui";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface-warm">
      <Container className="flex flex-col gap-2 py-10 text-sm text-muted">
        <p className="font-display text-base font-semibold text-fg">Threepetal</p>
        <p className="text-xs text-meta">Three petals at a time.</p>
        <p>A cozy puzzle garden you actually own. No ads. One fair price.</p>
        <p className="text-meta">
          Payments processed by LemonSqueezy (Merchant of Record). VAT/GST handled
          automatically.
        </p>
      </Container>
    </footer>
  );
}
