"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Settings, Users, Activity, CheckCircle } from "lucide-react";
import Link from "next/link";
import { OnboardingWizard } from "@/components/features/dashboard/OnboardingWizard";
import { SettingsModal } from "@/components/features/dashboard/SettingsModal";

export default function DashboardClient() {
  const { isLoading } = useConvexAuth(); 
  const user = useQuery(api.logs.getMe);

  if (isLoading || user === undefined) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-emerald-500 font-mono animate-pulse">
        SYNCING IDENTITY...
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-center p-6 font-sans">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl mb-6">
          <Activity className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Identity Sync Failure</h2>
        <p className="text-neutral-400 max-w-md mb-8">
          You are logged in, but your Convex database profile is missing. 
        </p>
      </div>
    );
  }

  if (user.hasCompletedSetup === false || user.hasCompletedSetup === undefined) {
    return <OnboardingWizard user={user} />;
  }

  return <DashboardMain user={user} />;
}

function DashboardMain({ user }: { user: any }) {
  const log = useQuery(api.logs.getTodayLog);
  const activeHabits = useQuery(api.logs.getUserActiveHabits);
  const logHabit = useMutation(api.logs.logCustomHabit);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const firedConfettiLogId = useRef<string | null>(null);

  // Helper to determine if a habit is met today
  const getHabitStatus = (habit: any) => {
    if (!log || !log.habitEntries) return { met: false, entry: null };
    const entry = log.habitEntries.find((e: any) => e.habitId === habit._id);
    if (!entry) return { met: false, entry: null };

    let met = false;
    if (habit.type === "yes_no") met = entry.completed;
    else if (habit.type === "numeric" && entry.numericValue !== undefined) {
      if (habit.goalDirection === ">=") met = entry.numericValue >= habit.goalValue;
      else if (habit.goalDirection === "<=") met = entry.numericValue <= habit.goalValue;
      else met = entry.numericValue === habit.goalValue;
    } else if (habit.type === "likert" && entry.likertValue !== undefined) {
      if (habit.goalDirection === ">=") met = entry.likertValue >= habit.goalValue;
      else if (habit.goalDirection === "<=") met = entry.likertValue <= habit.goalValue;
      else met = entry.likertValue === habit.goalValue;
    }
    return { met, entry };
  };

  const dailyHabits = activeHabits?.filter((h: any) => h.frequency === "daily") || [];
  const weeklyHabits = activeHabits?.filter((h: any) => h.frequency === "weekly") || [];

  const isPerfectDay = dailyHabits.length > 0 && dailyHabits.every((h: any) => getHabitStatus(h).met);

  useEffect(() => {
    if (!log) return;
    
    if (isPerfectDay && firedConfettiLogId.current !== log._id) {
      try {
        const fireConfetti = require("canvas-confetti");
        fireConfetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#059669', '#ffffff'],
          disableForReducedMotion: true
        });
      } catch (e) {
        console.warn("Confetti payload failed to load:", e);
      }
      firedConfettiLogId.current = log._id;
    } else if (!isPerfectDay && firedConfettiLogId.current === log._id) {
      firedConfettiLogId.current = null;
    }
  }, [isPerfectDay, log]);

  if (log === undefined || activeHabits === undefined) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-emerald-500 font-mono animate-pulse">
        SYNCING GRID...
      </div>
    );
  }

  let currentDay = 1;
  const now = new Date();
  now.setHours(now.getHours() - 2);
  if (user?.challengeStartDate) {
    const start = new Date(user.challengeStartDate);
    start.setHours(start.getHours() - 2);
    start.setHours(0,0,0,0);
    const todayObj = new Date(now);
    todayObj.setHours(0,0,0,0);
    const diffTime = Math.abs(todayObj.getTime() - start.getTime());
    currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 text-neutral-50 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] sm:px-6 sm:pb-6 sm:pt-[calc(env(safe-area-inset-top)+24px)] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-4 pb-32">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              Gritify <span className="text-emerald-500">Command</span>
            </h1>
            <div className="inline-flex items-center gap-2 mt-1 bg-neutral-900/80 px-3 py-1 rounded-full border border-neutral-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Day {currentDay || 1} of 75</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSettingsOpen(true)} className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all active:scale-95 shadow-sm">
              <Settings size={18} />
            </button>
            <Link href="/stats" className="h-10 px-4 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-500 font-bold text-xs gap-2 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/50 active:scale-95 shadow-sm">
              <Users size={16} /> <span className="hidden sm:inline">SQUAD</span>
            </Link>
            <Link href="/conquest" className="h-10 px-4 rounded-full bg-red-900/20 border border-red-500/50 flex items-center justify-center text-red-500 font-bold text-xs gap-2 transition-all hover:bg-red-500/10 hover:border-red-500 active:scale-95 shadow-sm">
              <Activity size={16} /> <span className="hidden sm:inline">CONQUEST</span>
            </Link>
          </div>
        </div>

        {/* DAILY HABITS */}
        {dailyHabits.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">Daily Protocol</h2>
            <div className="space-y-4">
              {dailyHabits.map((habit: any) => (
                <HabitCard key={habit._id} habit={habit} status={getHabitStatus(habit)} logHabit={logHabit} />
              ))}
            </div>
          </div>
        )}

        {/* WEEKLY HABITS */}
        {weeklyHabits.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">Weekly Objectives</h2>
            <div className="space-y-4">
              {weeklyHabits.map((habit: any) => (
                <HabitCard key={habit._id} habit={habit} status={getHabitStatus(habit)} logHabit={logHabit} />
              ))}
            </div>
          </div>
        )}

        {dailyHabits.length === 0 && weeklyHabits.length === 0 && (
          <div className="text-center py-12 border border-dashed border-neutral-800 rounded-3xl">
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm mb-4">No active habits</p>
            <button className="px-6 py-3 bg-emerald-500 text-neutral-950 font-black uppercase tracking-widest rounded-full text-xs">
              Configure Protocol
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {settingsOpen && <SettingsModal user={user} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function HabitCard({ habit, status, logHabit }: { habit: any, status: any, logHabit: any }) {
  const isMet = status.met;
  
  return (
    <div className={`p-5 rounded-[24px] border backdrop-blur-md transition-all ${isMet ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-neutral-900/40 border-neutral-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            {habit.name}
          </h3>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
            Goal: {habit.goalDirection} {habit.goalValue} {habit.type === 'yes_no' ? '' : '(numeric)'}
          </p>
        </div>
        {isMet && <CheckCircle size={20} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />}
      </div>
      
      {habit.type === 'yes_no' && (
        <button 
          onClick={() => logHabit({ habitId: habit._id, completed: !status.entry?.completed })}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] ${
            isMet ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
          }`}
        >
          {isMet ? 'Completed' : 'Mark Complete'}
        </button>
      )}

      {habit.type === 'numeric' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const val = Number(fd.get("val"));
          const current = status.entry?.numericValue || 0;
          logHabit({ habitId: habit._id, completed: true, numericValue: current + val });
          e.currentTarget.reset();
        }} className="flex gap-2">
           <div className="flex-1 flex items-baseline gap-2 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3">
             <span className="text-2xl font-black text-white">{status.entry?.numericValue || 0}</span>
             <span className="text-xs font-bold text-neutral-500">/ {habit.goalValue}</span>
           </div>
           <input type="number" name="val" required defaultValue={habit.goalValue} className="w-20 bg-neutral-950 border border-neutral-800 rounded-2xl px-2 text-center text-white font-bold" />
           <button type="submit" className={`px-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
             isMet ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
           }`}>Log</button>
        </form>
      )}

      {habit.type === 'likert' && (
        <div className="flex gap-2 justify-between">
          {[1,2,3,4,5].map(v => (
            <button key={v} onClick={() => logHabit({ habitId: habit._id, completed: true, likertValue: v })}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${status.entry?.likertValue === v ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:border-emerald-500/50'}`}>
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}