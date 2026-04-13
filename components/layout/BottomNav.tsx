"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, User, Settings, Bookmark, PlayCircle } from "lucide-react";

const items = [
  { href: "/study", label: "学習", icon: BookOpen },
  { href: "/grammar", label: "文法", icon: PlayCircle },
  { href: "/study/bookmarks", label: "復習", icon: Bookmark },
  { href: "/me", label: "マイページ", icon: User },
  { href: "/admin", label: "管理", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 nav-gradient shadow-[0_-4px_24px_-4px_rgba(11,65,160,0.25)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pendingHref === href ||
            (href === "/study" &&
              pathname === "/study") ||
            (href === "/study/bookmarks" &&
              pathname.startsWith("/study/bookmarks")) ||
            (href !== "/study" &&
              href !== "/study/bookmarks" &&
              (pathname === href || pathname.startsWith(href + "/")));
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`relative flex min-h-[60px] min-w-[64px] flex-1 flex-col items-center justify-center gap-1 transition-all active:scale-[0.95] ${
                active ? "text-white" : "text-white/60"
              }`}
              aria-current={active ? "page" : undefined}
              onClick={() => setPendingHref(href)}
            >
              {active && (
                <span className="absolute inset-x-2 inset-y-1.5 rounded-2xl bg-white/15" />
              )}
              <Icon
                className="relative z-10 h-5 w-5 shrink-0"
                strokeWidth={active ? 2.4 : 1.8}
              />
              <span className="relative z-10 text-[10px] font-semibold">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
