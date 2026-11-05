import Link from "next/link";
import { Sprout } from "lucide-react";
import { Container } from "./ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Sprout className="h-5 w-5 text-accent" strokeWidth={2} />
          <span>Threepetal</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-fg-2">
          <Link href="/play" className="hover:text-fg">
            Play
          </Link>
          <Link href="/unlock" className="hover:text-fg">
            Unlock
          </Link>
          <Link href="/account" className="hover:text-fg">
            Account
          </Link>
        </nav>
      </Container>
    </header>
  );
}
