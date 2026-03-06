"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, User, Settings } from "lucide-react";

const items = [
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/me", label: "My page", icon: User },
  { href: "/admin", label: "Admin", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  if (pathname === "/login") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border border-b-0 border-border bg-card/95 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-card/90"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pendingHref === href ||
            pathname === href ||
            pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className="flex min-h-[56px] min-w-[80px] flex-1 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-primary active:scale-[0.98]"
              aria-current={active ? "page" : undefined}
              onClick={() => setPendingHref(href)}
            >
              <Icon
                className="h-6 w-6 shrink-0"
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
