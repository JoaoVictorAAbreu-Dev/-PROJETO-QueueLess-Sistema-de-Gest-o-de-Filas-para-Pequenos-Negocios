import Link from "next/link";
import { Clock3, ExternalLink, LayoutDashboard, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clock3 className="size-4" />
            </span>
            QueueLess
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/public/${profile.public_slug}`} target="_blank">
                <ExternalLink className="size-4" />
                Tela publica
              </Link>
            </Button>
            <form action="/auth/sign-out" method="post">
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sair">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
