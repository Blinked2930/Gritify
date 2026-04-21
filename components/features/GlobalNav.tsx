"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignOutButton } from "@clerk/nextjs";
import { Home, Activity, Users, LogOut } from "lucide-react";

export function GlobalNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Grind", icon: Home },
    { href: "/stats", label: "Grid", icon: Activity },
    { href: "/partner", label: "Partner", icon: Users },
  ];

  return (
    <SignedIn>
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/80 pt-[max(env(safe-area-inset-top),1rem)] pb-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex gap-2 sm:gap-3">
            {links.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all ${
                    active 
                    ? "bg-emerald-500 text-neutral-950 shadow-[0_4px_20px_rgba(16,185,129,0.3)] scale-105" 
                    : "text-neutral-500 hover:text-white hover:bg-white/5 active:scale-95"
                  }`}
                >
                  <Icon size={16} />
                  <span className={active ? "inline" : "hidden sm:inline"}>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <SignOutButton>
            <button className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest text-neutral-500 hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all">
              <span className="hidden sm:inline">Logout</span>
              <LogOut size={16} />
            </button>
          </SignOutButton>
        </div>
      </div>
      {/* Spacer to push content down ensuring it doesn't collide with the fixed header */}
      <div className="h-[calc(max(env(safe-area-inset-top),1rem)+72px)] w-full shrink-0" />
    </SignedIn>
  );
}
