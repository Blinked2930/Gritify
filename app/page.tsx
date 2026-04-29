"use client";

import { SignedIn, SignedOut, SignUpButton, SignInButton } from "@clerk/nextjs";
import { ShieldCheck, Target, Users } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col relative overflow-hidden font-sans selection:bg-emerald-500/30">
      <div className="absolute top-[-20%] left-1/4 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center relative z-10 max-w-3xl mx-auto">
        
        <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
          <ShieldCheck size={40} className="text-emerald-500" />
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-tight">
          Welcome to <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">Gritify</span>
        </h1>
        
        <p className="text-neutral-400 text-lg sm:text-xl font-bold max-w-xl mb-12 leading-relaxed">
          The ultimate protocol engine. Lock in your habits, track your telemetry, and sync with your accountability squad. No excuses.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 w-full mb-16 text-left">
          <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl">
            <Target className="text-emerald-500 mb-3" size={24} />
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-2">Track Protocol</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">Log 2 workouts, hydration, reading, and progress photos daily.</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl">
            <Users className="text-emerald-500 mb-3" size={24} />
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-2">Squad Grid</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">Create a private vault to track your friends' live progress.</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl">
            <ShieldCheck className="text-emerald-500 mb-3" size={24} />
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-2">Privacy Control</h3>
            <p className="text-neutral-500 text-xs leading-relaxed">Strict broadcast limits. Hide calories or photos from the group.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="px-10 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest uppercase text-sm transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                Initialize Protocol
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="px-10 py-5 rounded-2xl bg-transparent border border-neutral-800 hover:bg-neutral-900 text-white font-black tracking-widest uppercase text-sm transition-all">
                Login
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard" className="px-10 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest uppercase text-sm transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] text-center w-full">
              Enter Command Center &rarr;
            </Link>
          </SignedIn>
        </div>
      </main>
    </div>
  );
}