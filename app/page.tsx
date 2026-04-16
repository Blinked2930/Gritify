"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CircularProgress } from "@/components/features/CircularProgress";
import { DailyVaultModal } from "@/components/features/DailyVaultModal";
import { Plus, Minus, Flame, Droplets, Dumbbell, Loader2, Lock, ShieldAlert, Sparkles } from "lucide-react";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  
  const todayLog = useQuery(api.logs.getTodayLog);
  const updateLog = useMutation(api.logs.updateLog);

  const WATER_GOAL = 128;
  const READING_GOAL = 10;

  if (!isLoaded || todayLog === undefined) {
    return (
      <div className="min-h-screen bg-grit-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-grit-orange animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-grit-obsidian text-white flex flex-col items-center justify-center p-6">
        <Flame className="w-16 h-16 text-grit-orange mb-6" />
        <h1 className="text-4xl font-black mb-8 text-center">Ready for the Grind?</h1>
        <SignInButton mode="modal">
          <button className="bg-grit-orange text-white px-8 py-4 rounded-full font-black tracking-widest uppercase hover:scale-105 transition-transform">
            Enter The Grid
          </button>
        </SignInButton>
      </div>
    );
  }

  const waterCount = todayLog?.waterTotal || 0;
  const pagesRead = todayLog?.readingTotal || 0;
  const workout1Done = todayLog?.workout1?.done || false;
  const workout2Done = todayLog?.workout2?.done || false;
  const workoutsCompleted = (workout1Done ? 1 : 0) + (workout2Done ? 1 : 0);
  const hasCompletedVault = todayLog?.qAndA && todayLog.qAndA.length > 0;
  const isVouchPending = todayLog?.status === "vouch_pending";
  const isVouched = todayLog?.status === "vouched";

  return (
    <main className="min-h-screen bg-grit-obsidian text-white p-6 pb-32 font-sans relative">
      <header className="mb-10 pt-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="text-grit-orange w-5 h-5 fill-grit-orange" />
            <span className="text-grit-orange font-black text-sm uppercase tracking-widest">Live</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Gritify.</h1>
          <p className="text-white/40 text-sm mt-1">Welcome back, {user?.firstName}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center justify-center">
            <Droplets className="text-grit-cyan w-6 h-6" />
          </div>
          <SignOutButton>
            <button className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white/80 transition-colors">
              Log Out
            </button>
          </SignOutButton>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="col-span-1 bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center">
          <CircularProgress 
            value={waterCount} 
            max={WATER_GOAL} 
            label="Ounces" 
            colorClass="text-grit-cyan"
            size={130}
          />
          <div className="flex items-center gap-3 mt-6 bg-white/5 rounded-full p-1 border border-white/5">
            <button onClick={() => updateLog({ waterTotal: Math.max(0, waterCount - 8) })} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Minus size={16} /></button>
            <span className="font-bold text-sm w-8 text-center">{waterCount}</span>
            <button onClick={() => updateLog({ waterTotal: waterCount + 8 })} className="p-2 bg-grit-cyan/20 text-grit-cyan rounded-full transition-all active:scale-90"><Plus size={16} /></button>
          </div>
        </div>

        <div className="col-span-1 bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center">
          <CircularProgress 
            value={pagesRead} 
            max={READING_GOAL} 
            label="Pages" 
            colorClass="text-grit-purple"
            size={130}
          />
          <div className="flex items-center gap-3 mt-6 bg-white/5 rounded-full p-1 border border-white/5">
            <button onClick={() => updateLog({ readingTotal: Math.max(0, pagesRead - 1) })} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Minus size={16} /></button>
            <span className="font-bold text-sm w-8 text-center">{pagesRead}</span>
            <button onClick={() => updateLog({ readingTotal: pagesRead + 1 })} className="p-2 bg-grit-purple/20 text-grit-purple rounded-full transition-all active:scale-90"><Plus size={16} /></button>
          </div>
        </div>

        <div className="col-span-2 bg-white/5 border border-white/10 p-6 rounded-[3rem]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight">The Grind</h3>
              <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Session 1 • Session 2</p>
            </div>
            <Dumbbell className={workoutsCompleted === 2 ? "text-grit-orange" : "text-white/20"} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => updateLog({ workout1Done: !workout1Done })} className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${workout1Done ? 'bg-grit-orange text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}>Workout 1</button>
            <button onClick={() => updateLog({ workout2Done: !workout2Done })} className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${workout2Done ? 'bg-grit-orange text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}>Workout 2</button>
          </div>
        </div>
      </div>

      <button onClick={() => setIsVaultOpen(true)} className="w-full bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between mb-4 hover:bg-white/10 transition-colors active:scale-[0.98]">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full transition-colors ${hasCompletedVault ? 'bg-grit-purple text-white shadow-[0_0_15px_rgba(181,51,255,0.3)]' : 'bg-white/5 text-white/50'}`}>
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-black italic uppercase tracking-tight">The Vault</h3>
            <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Daily Reflections</p>
          </div>
        </div>
        <div className={`text-xs font-black uppercase tracking-widest ${hasCompletedVault ? 'text-grit-purple' : 'text-white/20'}`}>
          {hasCompletedVault ? 'Sealed ✓' : 'Pending'}
        </div>
      </button>

      {/* The Wrapped Trigger Button */}
      <Link href="/wrapped" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-grit-purple to-grit-cyan text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(181,51,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all mb-6">
        <Sparkles size={18} /> View 75-Day Wrapped
      </Link>

      {/* Vouch Status Area */}
      {isVouchPending ? (
        <div className="w-full bg-grit-orange/20 border border-grit-orange/50 p-4 rounded-2xl text-center mb-4">
          <span className="text-grit-orange font-black uppercase tracking-widest text-xs">Vouch Pending Partner Review</span>
        </div>
      ) : isVouched ? (
        <div className="w-full bg-grit-purple/20 border border-grit-purple/50 p-4 rounded-2xl text-center mb-4">
          <span className="text-grit-purple font-black uppercase tracking-widest text-xs">Day Saved by Partner Vouch</span>
        </div>
      ) : (
        <button onClick={() => updateLog({ vouchRequested: true })} className="w-full flex items-center justify-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest mb-4 hover:text-grit-orange transition-colors">
          <ShieldAlert size={14} /> Request Partner Vouch
        </button>
      )}

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-grit-obsidian via-grit-obsidian to-transparent border-none z-10 pointer-events-none">
        <Link href="/partner" className="pointer-events-auto flex items-center justify-center w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
          View Partner Matrix
        </Link>
      </footer>

      <DailyVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} onSave={(qAndA) => updateLog({ qAndA })} initialData={todayLog?.qAndA || []} />
    </main>
  );
}