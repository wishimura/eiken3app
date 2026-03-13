"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";

const NAV_PADDING = "max(76px, calc(60px + env(safe-area-inset-bottom, 0px)))";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== "/login" && pathname !== "/signup";

  return (
    <>
      <main
        className="min-h-screen"
        style={
          showNav
            ? { paddingBottom: NAV_PADDING }
            : undefined
        }
      >
        {children}
      </main>
      <BottomNav />
    </>
  );
}
