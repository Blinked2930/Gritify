"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Camera, Settings, Plus, Minus, CheckCircle, Droplet, BookOpen, Users, Flame, Activity, ShieldCheck, Dumbbell } from "lucide-react";
import Link from "next/link";
import { OnboardingWizard } from "@/components/features/dashboard/OnboardingWizard";
import { SettingsModal } from "@/components/features/dashboard/SettingsModal";
import { WorkoutModal } from "@/components/features/dashboard/WorkoutModal";

export default function DashboardClient() {
  const user = useQuery(api.logs.getMe);

  if (user === undefined) {
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

  // INTERCEPT NEW USERS FOR SETUP
  if (user.hasCompletedSetup === false || user.hasCompletedSetup === undefined) {
    return <OnboardingWizard user={user} />;
  }

  return <DashboardMain user={user} />;
}

function DashboardMain({ user }: { user: any }) {
  const log = useQuery(api.logs.getTodayLog);
  const updateLog = useMutation(api.logs.updateLog);
  const generateUploadUrl = useMutation(api.logs.generateUploadUrl);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workoutPanelOpen, setWorkoutPanelOpen] = useState<"workout1" | "workout2" | null>(null);
  
  if (log === undefined) {
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

  const handleAddWater = () => {
    const currentTotal = log?.waterTotal || 0;
    updateLog({ waterTotal: currentTotal + 1 });
  };
  
  const handleAddPages = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pgs = Number(formData.get("pages"));
    if (pgs !== 0) {
      const current = log?.readingTotal || 0;
      updateLog({ readingTotal: Math.max(0, current + pgs) });
      e.currentTarget.reset();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsPhotoUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateLog({ photoStorageId: storageId });
    } catch (err) {
      console.error(err);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const currentWaterAmountStr = log ? ((log?.waterTotal || 0) * (user?.vesselSize || 128)) : 0;
  const waterTarget = user?.vesselUnit === "liters" ? 3.78 : user?.vesselUnit === "ml" ? 3785 : 128;
  const isWaterMet = currentWaterAmountStr >= waterTarget;
  const readingGoal = user?.dailyReadingGoal || 10; 
  const isPagesMet = log ? (log?.readingTotal || 0) >= readingGoal : false;
  const isW1Met = log?.workout1?.done;
  const isW2Met = log?.workout2?.done;
  const isDisciplineMet = log?.diet && log?.photoStorageId;

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
          </div>
        </div>

        {/* WORKOUT 1 */}
        <div className={`p-5 rounded-[24px] border backdrop-blur-md transition-all ${isW1Met ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-neutral-900/40 border-neutral-800'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Flame size={16} className={isW1Met ? "text-emerald-500" : "text-neutral-500"} /> Workout 1
              </h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">45 Min Outdoor Minimum</p>
            </div>
            {isW1Met && <CheckCircle size={20} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />}
          </div>
          <button 
            onClick={() => {
              if (log?.workout1?.done) updateLog({ workout1Done: false });
              else setWorkoutPanelOpen("workout1");
            }}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] ${
              isW1Met ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
            }`}
          >
            {isW1Met ? 'Session Verified' : 'Log Outdoor Session'}
          </button>
        </div>

        {/* WORKOUT 2 */}
        <div className={`p-5 rounded-[24px] border backdrop-blur-md transition-all ${isW2Met ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-neutral-900/40 border-neutral-800'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Dumbbell size={16} className={isW2Met ? "text-emerald-500" : "text-neutral-500"} /> Workout 2
              </h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">45 Min Minimum</p>
            </div>
            {isW2Met && <CheckCircle size={20} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />}
          </div>
          <button 
            onClick={() => {
              if (log?.workout2?.done) updateLog({ workout2Done: false });
              else setWorkoutPanelOpen("workout2");
            }}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] ${
              isW2Met ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
            }`}
          >
            {isW2Met ? 'Session Verified' : 'Log Indoor Session'}
          </button>
        </div>

        {/* HYDRATION */}
        <div className={`p-5 rounded-[24px] border backdrop-blur-md transition-all ${isWaterMet ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-neutral-900/40 border-neutral-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Droplet size={16} className={isWaterMet ? "text-emerald-500" : "text-blue-500"} /> Hydration
              </h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Goal: {waterTarget} {user?.vesselUnit || "oz"}</p>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter text-white">{currentWaterAmountStr.toFixed(user?.vesselUnit === "liters" ? 2 : 0)}</span>
              <span className="text-sm font-bold text-neutral-500 mb-1">/ {waterTarget}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => updateLog({ waterTotal: Math.max(0, (log?.waterTotal || 0) - 1) })} className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:border-neutral-600 transition-all active:scale-90"><Minus size={20} /></button>
              <button onClick={handleAddWater} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isWaterMet ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400'}`}>
                {isWaterMet ? <CheckCircle size={22} /> : <Plus size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* READING */}
        <div className={`p-5 rounded-[24px] border backdrop-blur-md transition-all ${isPagesMet ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-neutral-900/40 border-neutral-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={16} className={isPagesMet ? "text-emerald-500" : "text-amber-500"} /> Reading
              </h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Goal: {readingGoal} Pages Non-Fiction</p>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter text-white">{log?.readingTotal || 0}</span>
              <span className="text-sm font-bold text-neutral-500 mb-1">/ {readingGoal}</span>
            </div>
            <form onSubmit={handleAddPages} className="flex gap-2 w-1/2">
              <input type="number" name="pages" required defaultValue={readingGoal} className="w-16 bg-neutral-950 border border-neutral-800 rounded-2xl px-2 py-3 text-center text-neutral-200 font-bold focus:outline-none focus:border-emerald-500 transition-colors" />
              <button type="submit" className={`flex-1 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${isPagesMet ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-400'}`}>Log</button>
            </form>
          </div>
        </div>

        {/* DISCIPLINE CHECKS */}
        <div className={`p-5 rounded-[24px] border backdrop-blur-md transition-all ${isDisciplineMet ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-neutral-900/40 border-neutral-800'}`}>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className={isDisciplineMet ? "text-emerald-500" : "text-neutral-500"} /> Discipline Checks
          </h3>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-5">Diet followed. No alcohol. Photo taken.</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => updateLog({ diet: log?.diet === false ? true : false })} className={`py-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 flex flex-col items-center justify-center gap-2 ${log?.diet ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-emerald-500/50"}`}>
              {log?.diet ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-neutral-600 rounded-full" />} Diet Perfect
            </button>
            
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isPhotoUploading} className={`py-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 flex flex-col items-center justify-center gap-2 ${log?.photoStorageId ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-emerald-500/50"}`}>
              {isPhotoUploading ? <span className="animate-pulse flex flex-col items-center gap-2"><Camera size={20} /> Uploading...</span> : log?.photoUrl ? <><CheckCircle size={20} /> Photo Secured</> : <><Camera size={20} className="text-neutral-500" /> Upload Photo</>}
            </button>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {settingsOpen && <SettingsModal user={user} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {workoutPanelOpen && <WorkoutModal user={user} type={workoutPanelOpen} onClose={() => setWorkoutPanelOpen(null)} />}
      </AnimatePresence>
    </div>
  );
}