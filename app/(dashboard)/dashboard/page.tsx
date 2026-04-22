import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./ClientPage";

export default async function DashboardPage() {
  // This physically blocks anyone without an account
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <DashboardClient />;
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Settings, X, PlusCircle, MinusCircle, CheckCircle, NotebookPen, Droplet, BookOpen, Users, Flame, Activity } from "lucide-react";
import Link from "next/link";
import { DAILY_VAULT_QUESTIONS as QUESTIONS } from "@/lib/vault-questions";
import { CustomDropdown } from "@/components/features/CustomDropdown";

const EXERCISE_OPTIONS = [
  { label: "Running", value: "running", met: 9.8 },
  { label: "Walking", value: "walking", met: 3.8 },
  { label: "Cycling", value: "cycling", met: 7.5 },
  { label: "Weightlifting", value: "weightlifting", met: 6.0 },
  { label: "Yoga / Pilates", value: "yoga", met: 3.0 },
  { label: "HIIT", value: "hiit", met: 8.0 },
  { label: "Swimming", value: "swimming", met: 7.0 },
  { label: "Other", value: "other", met: 5.0 },
];

export default function DashboardClient() {
  const user = useQuery(api.logs.getMe);
  const log = useQuery(api.logs.getTodayLog);
  const updateLog = useMutation(api.logs.updateLog);
  const evaluateContinuity = useMutation(api.logs.evaluateContinuity);
  const updateSettings = useMutation(api.logs.updateUserSettings);
  const generateUploadUrl = useMutation(api.logs.generateUploadUrl);
  const requestBackfill = useMutation(api.logs.requestBackfill);
  
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionA, setReflectionA] = useState("");
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vesselSizeInput, setVesselSizeInput] = useState("128");
  const [vesselUnitInput, setVesselUnitInput] = useState<"oz" | "ml" | "liters">("oz");
  const [bodyWeightInput, setBodyWeightInput] = useState("150");
  const [weightUnitInput, setWeightUnitInput] = useState<"lbs" | "kg">("lbs");
  
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced Workout Logging State
  const [workoutPanelOpen, setWorkoutPanelOpen] = useState<"workout1" | "workout2" | null>(null);
  const [workoutType, setWorkoutType] = useState("running");
  const [workoutDuration, setWorkoutDuration] = useState("45");

  useEffect(() => {
    if (user) {
      evaluateContinuity().catch(err => console.log("Continuity check wait:", err));
    }
  }, [evaluateContinuity, user]);
  
  useEffect(() => {
    if (user?.vesselSize) setVesselSizeInput(user.vesselSize.toString());
    if (user?.vesselUnit) setVesselUnitInput(user.vesselUnit as any);
    if (user?.bodyWeight) setBodyWeightInput(user.bodyWeight.toString());
    if (user?.weightUnit) setWeightUnitInput(user.weightUnit as any);
    
    if (log?.qAndA && log.qAndA.length > 0) {
      setReflectionA(log.qAndA[0].answer);
    }
  }, [user, log]);

  // STATE 1: Check User First
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-emerald-500 font-mono animate-pulse">
        SYNCING IDENTITY...
      </div>
    );
  }

  // STATE 2: The Null Identity Failsafe (Webhook Failed)
  if (user === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-center p-6 font-sans">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl mb-6">
          <Activity className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Identity Sync Failure</h2>
        <p className="text-neutral-400 max-w-md mb-8">
          You are logged in, but your Convex database profile is missing. 
          This means your Clerk Webhook did not fire to tell your database to create your account.
        </p>
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-left">
          <p className="text-xs text-neutral-500 font-mono">
            Action Required: Add app/api/webhook/route.ts from your old repo and link your Vercel URL in the Clerk Webhooks dashboard.
          </p>
        </div>
      </div>
    );
  }

  // STATE 3: User exists! Now wait for the daily log
  if (log === undefined) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-emerald-500 font-mono animate-pulse">
        SYNCING GRID...
      </div>
    );
  }

  // Calculate Dynamic Day
  let currentDay = 1;
  const now = new Date();
  now.setHours(now.getHours() - 2);
  if (user.challengeStartDate) {
    const start = new Date(user.challengeStartDate);
    start.setHours(start.getHours() - 2);
    // Ignore time within the day, focus on calendar dates only
    start.setHours(0,0,0,0);
    const todayObj = new Date(now);
    todayObj.setHours(0,0,0,0);
    const diffTime = Math.abs(todayObj.getTime() - start.getTime());
    currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Calculate Deterministic Global Vault Question
  const localDateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  let dateHash = 0;
  for (let i = 0; i < localDateStr.length; i++) {
    dateHash = (dateHash * 31 + localDateStr.charCodeAt(i)) % 100000;
  }
  const globalQuestionIndex = Math.abs(dateHash) % QUESTIONS.length;

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

  const handleSaveReflection = () => {
    const questionText = QUESTIONS[globalQuestionIndex];
    updateLog({ qAndA: [{ question: questionText, answer: reflectionA }] });
    setReflectionOpen(false);
  };

  const handleLogWorkout = (type: "workout1" | "workout2", isQuick: boolean) => {
    if (isQuick) {
      updateLog({ [`${type}Done`]: true } as any);
      setWorkoutPanelOpen(null);
    } else {
      const selected = EXERCISE_OPTIONS.find(o => o.value === workoutType);
      const met = selected?.met || 5.0;
      
      const weightMultiplier = (user.weightUnit === "kg" || weightUnitInput === "kg") ? 1 : 0.453592;
      const weightKg = (user.bodyWeight || 150) * weightMultiplier;
      
      const durationHours = (parseFloat(workoutDuration) || 45) / 60;
      const calsBurned = Math.round(met * weightKg * durationHours);
      
      // Typecasting the dynamic update structure for Convex
      if (type === "workout1") {
        updateLog({ workout1: { done: true, notes: selected?.label || "Other", cals: calsBurned } });
      } else {
        updateLog({ workout2: { done: true, notes: selected?.label || "Other", cals: calsBurned } });
      }
      setWorkoutPanelOpen(null);
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

  const currentWaterAmountStr = log ? (log.waterTotal * user.vesselSize) : 0;
  const waterTarget = user.vesselUnit === "liters" ? 3.78 : user.vesselUnit === "ml" ? 3785 : 128;
  const isWaterMet = currentWaterAmountStr >= waterTarget;
  const isPagesMet = log ? log.readingTotal >= user.dailyReadingGoal : false;
  
  const isW1Met = log?.workout1?.done;
  const isW2Met = log?.workout2?.done;
  const isDisciplineMet = log?.diet && log?.photoStorageId;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-4 sm:p-6 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-32">
        
        {/* Header Section */}
        <div className="flex items-end justify-between border-b border-neutral-800 pb-6 pt-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase flex items-center gap-3">
              Gritify <span className="text-emerald-500">Command</span>
              <button onClick={() => setSettingsOpen(true)} className="text-neutral-600 hover:text-emerald-500 transition-colors">
                <Settings size={20} />
              </button>
            </h1>
            <p className="text-neutral-400 mt-2 text-sm sm:text-base flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Day {currentDay} of 75
            </p>
          </div>
          <div className="text-right flex items-center gap-3">
            <Link href="/stats" className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg">
              <Activity size={16} /> <span className="hidden sm:inline">STATS</span>
            </Link>
            <Link href="/partner" className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg">
              <Users size={16} /> <span className="hidden sm:inline">PARTNER</span>
            </Link>
            <button 
              onClick={() => setReflectionOpen(true)}
              className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              <NotebookPen size={16} /> <span className="hidden sm:inline">REFLECT</span>
            </button>
          </div>
        </div>

        {/* Backfill Alert */}
        {currentDay === 1 && user.lastFailedStartDate && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-amber-500 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Grid Reset Detected
              </h3>
              <p className="text-amber-500/80 text-xs mt-1 max-w-sm">
                You missed tracking yesterday. If you genuinely completed the protocol, you can request a partner backfill vouch to restore your streak.
              </p>
            </div>
            <button 
              onClick={() => requestBackfill()}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.2)] whitespace-nowrap transition-colors"
            >
              Request Vouch
            </button>
          </div>
        )}

        {/* 75 Hard Daily Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Workout 1 (Outdoor) */}
          <div className={`relative overflow-hidden border p-5 rounded-2xl shadow-sm transition-all z-0 ${isW1Met ? 'border-emerald-500/40' : 'bg-neutral-900 border-neutral-800'}`}>
            <div className={`absolute inset-0 bg-emerald-500/20 transition-opacity duration-1000 -z-10 ${isW1Met ? 'opacity-100' : 'opacity-0'}`} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-200 uppercase tracking-wide">Workout 1 <span className="text-neutral-500 text-sm">(Outdoor)</span></h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4 font-mono">45 MIN MINIMUM</p>
              <button 
                onClick={() => {
                  if (log?.workout1?.done) updateLog({ workout1Done: false });
                  else setWorkoutPanelOpen("workout1");
                }}
                className={`w-full py-4 rounded-xl border transition-all font-black text-sm flex items-center justify-center gap-3 uppercase tracking-wider ${
                  log?.workout1?.done 
                  ? "bg-emerald-500 text-neutral-950 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "bg-neutral-950 hover:bg-emerald-600/10 text-neutral-400 border-neutral-800 hover:border-emerald-500/50"
                }`}
              >
                {log?.workout1?.done ? (
                  <>
                    <CheckCircle size={20} /> OUTDOOR WORKOUT
                    {log?.workout1?.cals && log.workout1.cals > 0 ? (
                      <span className="font-mono text-[10px] ml-2 opacity-80 border border-current px-2 rounded">{log.workout1.cals} CAL</span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 border-2 border-current rounded-full opacity-50" /> OUTDOOR WORKOUT
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Workout 2 */}
          <div className={`relative overflow-hidden border p-5 rounded-2xl shadow-sm transition-all z-0 ${isW2Met ? 'border-emerald-500/40' : 'bg-neutral-900 border-neutral-800'}`}>
            <div className={`absolute inset-0 bg-emerald-500/20 transition-opacity duration-1000 -z-10 ${isW2Met ? 'opacity-100' : 'opacity-0'}`} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-200 uppercase tracking-wide">Workout 2</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4 font-mono">45 MIN MINIMUM</p>
              <button 
                onClick={() => {
                  if (log?.workout2?.done) updateLog({ workout2Done: false });
                  else setWorkoutPanelOpen("workout2");
                }}
                className={`w-full py-4 rounded-xl border transition-all font-black text-sm flex items-center justify-center gap-3 uppercase tracking-wider ${
                  log?.workout2?.done 
                  ? "bg-emerald-500 text-neutral-950 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "bg-neutral-950 hover:bg-emerald-600/10 text-neutral-400 border-neutral-800 hover:border-emerald-500/50"
                }`}
              >
                {log?.workout2?.done ? (
                  <>
                    <CheckCircle size={20} /> INDOOR WORKOUT
                    {log?.workout2?.cals && log.workout2.cals > 0 ? (
                      <span className="font-mono text-[10px] ml-2 opacity-80 border border-current px-2 rounded">{log.workout2.cals} CAL</span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 border-2 border-current rounded-full opacity-50" /> INDOOR WORKOUT
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Hydration */}
          <div className={`border p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden transition-all z-0 ${isWaterMet ? 'border-emerald-500/40' : 'bg-neutral-900 border-neutral-800'}`}>
            <div className={`absolute bottom-0 left-0 right-0 ${isWaterMet ? 'bg-emerald-500/20' : 'bg-emerald-500/10'} transition-all duration-1000 ease-out -z-10`} style={{height: `${Math.min((currentWaterAmountStr / waterTarget) * 100, 100)}%`}} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-2"><Droplet size={18} className="text-emerald-500" /> Hydration</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4 font-mono">1 GALLON ({waterTarget} {user.vesselUnit})</p>
            </div>
            
            <div className="relative z-10 flex items-center justify-between gap-4 mt-auto">
              <div className="flex-1">
                <p className="text-3xl font-black text-white tracking-tighter">
                  {currentWaterAmountStr.toFixed(user.vesselUnit === "liters" ? 2 : 0)}<span className="text-sm font-bold text-neutral-500 ml-1">/ {waterTarget}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => updateLog({ waterTotal: Math.max(0, (log?.waterTotal || 0) - 1) })}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-950 border border-neutral-700 text-neutral-400 hover:border-emerald-500 hover:text-emerald-500 transition-all"
                >
                  <MinusCircle size={20} />
                </button>
                <button 
                  onClick={handleAddWater}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isWaterMet ? 'bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-neutral-950 border border-neutral-700 text-emerald-500 hover:border-emerald-500'}`}
                >
                  {isWaterMet ? <CheckCircle size={20} /> : <PlusCircle size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Reading */}
          <div className={`relative overflow-hidden border p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all z-0 ${isPagesMet ? 'border-emerald-500/40' : 'bg-neutral-900 border-neutral-800'}`}>
            <div className={`absolute bottom-0 left-0 right-0 ${isPagesMet ? 'bg-emerald-500/20' : 'bg-emerald-500/10'} transition-all duration-1000 ease-out -z-10`} style={{height: `${Math.min(((log?.readingTotal || 0) / (user.dailyReadingGoal || 10)) * 100, 100)}%`}} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-2"><BookOpen size={18} className="text-emerald-500" /> Reading</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4 font-mono">{user.dailyReadingGoal} PAGES NON-FICTION</p>
            </div>
            <div className="relative z-10 flex items-center gap-4 mt-auto">
              <div className="flex-1">
                <p className="text-3xl font-black text-white tracking-tighter">
                  {log?.readingTotal || 0}<span className="text-sm font-bold text-neutral-500 ml-1">/ {user.dailyReadingGoal}</span>
                </p>
              </div>
            </div>
            <form onSubmit={handleAddPages} className="relative z-10 mt-4">
              <div className="flex gap-2 mb-2">
                <input 
                  type="number" 
                  name="pages"
                  required
                  placeholder="± pgs" 
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 w-24 text-neutral-200 font-bold text-base focus:outline-none focus:border-emerald-500 transition-colors" 
                />
                <button type="submit" className={`flex-1 py-3 rounded-xl border transition-all font-black uppercase text-sm ${isPagesMet ? 'bg-emerald-500 text-neutral-950 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-neutral-950 hover:bg-emerald-500/10 hover:text-emerald-500 text-neutral-400 border-neutral-800 hover:border-emerald-500/50'}`}>
                  {isPagesMet ? 'LOGGED ✓' : 'LOG PAGES'}
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 font-mono">Tip: Enter negative number (-5) to subtract.</p>
            </form>
          </div>

          {/* Diet & Progress Pic */}
          <div className={`relative overflow-hidden border p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col justify-between transition-all z-0 ${isDisciplineMet ? 'border-emerald-500/40' : 'bg-neutral-900 border-neutral-800'}`}>
            <div className={`absolute inset-0 bg-emerald-500/20 transition-opacity duration-1000 -z-10 ${isDisciplineMet ? 'opacity-100' : 'opacity-0'}`} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-200 uppercase tracking-wide">Discipline Checks</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4 font-mono">DIET FOLLOWED. NO ALCOHOL. PICTURE TAKEN.</p>
            </div>
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
              <button 
                onClick={() => updateLog({ diet: log?.diet === false ? true : false })}
                className={`py-4 rounded-xl border transition-all font-black text-sm flex items-center justify-center gap-3 uppercase tracking-wider ${
                  log?.diet 
                  ? "bg-emerald-500 text-neutral-950 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "bg-neutral-950 hover:bg-emerald-600/10 text-neutral-400 border-neutral-800 hover:border-emerald-500/50"
                }`}
              >
                {log?.diet ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-current rounded-full opacity-50" />}
                DIET PERFECT
              </button>
              
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handlePhotoUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isPhotoUploading}
                className={`py-4 rounded-xl border transition-all font-black text-sm flex items-center justify-center gap-3 uppercase tracking-wider ${
                  log?.photoStorageId 
                  ? "bg-emerald-500 text-neutral-950 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "bg-neutral-950 hover:bg-emerald-600/10 text-neutral-400 border-neutral-800 hover:border-emerald-500/50"
                }`}
              >
                {isPhotoUploading ? (
                  <span className="animate-pulse">UPLOADING...</span>
                ) : log?.photoUrl ? (
                  <>
                    <img src={log.photoUrl} alt="Progress Pic" className="absolute inset-0 w-full h-full object-cover opacity-60 rounded-xl" />
                    <div className="relative z-10 flex items-center gap-2 drop-shadow-md text-white font-black"><CheckCircle size={20} className="text-emerald-400" /> PHOTO SECURED</div>
                  </>
                ) : (
                  <><Camera size={20} /> UPLOAD PHOTO</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Incoming Partner Reactions */}
        {log?.reactions && log.reactions.length > 0 && (
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Partner Reacted:</h3>
            <div className="flex gap-2">
              {log.reactions.map((emoji: string, i: number) => (
                <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 100}ms` }}>{emoji}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reflections Slide-In Panel */}
      <AnimatePresence>
        {reflectionOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setReflectionOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 rounded-t-3xl p-6 z-50 h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Vault Reflection</h2>
                <button onClick={() => setReflectionOpen(false)} className="bg-neutral-800 p-2 rounded-full text-neutral-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-neutral-400 text-sm mb-4 font-mono">{QUESTIONS[globalQuestionIndex]}</p>
              
              <textarea 
                value={reflectionA}
                onChange={(e) => setReflectionA(e.target.value)}
                className="flex-1 w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-5 text-neutral-200 focus:outline-none focus:border-emerald-500 resize-none font-mono text-base transition-colors"
                placeholder="The body is resting, but what did the mind learn today?"
              ></textarea>
              
              <div className="mt-6">
                <button onClick={handleSaveReflection} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest rounded-xl transition-all uppercase text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  Commit to Vault
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl relative z-10 w-full max-w-sm">
              <h2 className="text-xl font-black text-white mb-4 uppercase">Preferences</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Vessel Size</label>
                    <input 
                      type="text" 
                      value={vesselSizeInput} 
                      onChange={e => setVesselSizeInput(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono" 
                    />
                  </div>
                  <div className="w-1/3 text-left">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Unit</label>
                    <CustomDropdown 
                      options={[{label: "oz", value: "oz"}, {label: "ml", value: "ml"}, {label: "liters", value: "liters"}]}
                      value={vesselUnitInput}
                      onChange={(val) => setVesselUnitInput(val as "oz" | "ml" | "liters")}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Weight</label>
                    <input 
                      type="number" 
                      value={bodyWeightInput} 
                      onChange={e => setBodyWeightInput(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono" 
                    />
                  </div>
                  <div className="w-1/3 text-left">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Unit</label>
                    <CustomDropdown 
                      options={[{label: "lbs", value: "lbs"}, {label: "kg", value: "kg"}]}
                      value={weightUnitInput}
                      onChange={(val) => setWeightUnitInput(val as "lbs" | "kg")}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 -mt-2 font-mono">Used to power calorie estimator algorithms.</p>
                <p className="text-xs text-neutral-500 mt-2">Each hydration tap logs exactly this amount. Target translates to 1 Gallon total.</p>
                <button 
                  onClick={() => {
                    const parsed = parseFloat(vesselSizeInput);
                    const bwParsed = parseFloat(bodyWeightInput);
                    if (!isNaN(parsed) && parsed > 0) {
                      updateSettings({ 
                        vesselSize: parsed, 
                        vesselUnit: vesselUnitInput,
                        ...(isNaN(bwParsed) ? {} : { bodyWeight: bwParsed, weightUnit: weightUnitInput })
                      });
                    }
                    setSettingsOpen(false);
                  }}
                  className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition-colors mt-4"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advanced Workout Slide-In Panel */}
      <AnimatePresence>
        {workoutPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setWorkoutPanelOpen(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 rounded-t-3xl p-6 z-50 flex flex-col pb-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Log {workoutPanelOpen === "workout1" ? "Outdoor" : "Indoor"} Session</h2>
                <button onClick={() => setWorkoutPanelOpen(null)} className="bg-neutral-800 p-2 rounded-full text-neutral-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Movement Protocol</label>
                  <CustomDropdown 
                    options={EXERCISE_OPTIONS}
                    value={workoutType}
                    onChange={setWorkoutType}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                  <input 
                    type="number" 
                    value={workoutDuration} 
                    onChange={(e) => setWorkoutDuration(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono text-lg" 
                  />
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => handleLogWorkout(workoutPanelOpen, false)} 
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest rounded-xl transition-all uppercase text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                >
                  <Flame size={18} /> Calculate & Log
                </button>
                <button 
                  onClick={() => handleLogWorkout(workoutPanelOpen, true)} 
                  className="px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-black tracking-widest rounded-xl transition-all uppercase text-sm"
                >
                  Skip Let's Go
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}