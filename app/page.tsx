"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { Flame, Loader2 } from "lucide-react";
import DashboardClient from "./(dashboard)/dashboard/ClientPage";

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <Flame className="w-16 h-16 text-emerald-500 mb-6" />
        <h1 className="text-4xl font-black mb-8 text-center uppercase tracking-tight">Ready for the Grind?</h1>
        <SignInButton mode="modal">
          <button className="bg-emerald-500 text-neutral-950 px-8 py-4 rounded-full font-black tracking-widest uppercase hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            Enter The Grid
          </button>
        </SignInButton>
      </div>
    );
  }

  return <DashboardClient />;
}