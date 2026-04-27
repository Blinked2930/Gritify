"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Settings, X, Plus, Minus, CheckCircle, Droplet, BookOpen, Users, Flame, Activity, ShieldCheck, Dumbbell, Shield } from "lucide-react";
import Link from "next/link";
import { DAILY_VAULT_QUESTIONS as QUESTIONS } from "@/lib/vault-questions";
import { CustomDropdown } from "@/components/features/CustomDropdown";
import { useClerk } from "@clerk/nextjs";

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

  return <DashboardMain user={user} />;
}

function DashboardMain({ user }: { user: any }) {
  const { signOut } = useClerk();
  
  const log = useQuery(api.logs.getTodayLog);
  const updateLog = useMutation(api.logs.updateLog);
  const updateSettings = useMutation(api.logs.updateUserSettings);
  const joinSquad = useMutation(api.logs.joinSquad);
  const generateUploadUrl = useMutation(api.logs.generateUploadUrl);
  
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionA, setReflectionA] = useState("");
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vesselSizeInput, setVesselSizeInput] = useState("128");
  const [vesselUnitInput, setVesselUnitInput] = useState<"oz" | "ml" | "liters">("oz");
  const [bodyWeightInput, setBodyWeightInput] = useState("160");
  const [weightUnitInput, setWeightUnitInput] = useState<"lbs" | "kg">("lbs");
  const [squadIdInput, setSquadIdInput] = useState("");
  
  const [privacySettings, setPrivacySettings] = useState({
    shareWorkouts: true,
    shareWater: true,
    shareReading: true,
    shareDiet: true,
    sharePhotos: false,
  });
  
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workoutPanelOpen, setWorkoutPanelOpen] = useState<"workout1" | "workout2" | null>(null);
  const [workoutType, setWorkoutType] = useState("running");
  const [workoutDuration, setWorkoutDuration] = useState("45");
  
  useEffect(() => {
    if (user?.vesselSize) setVesselSizeInput(user.vesselSize.toString());
    if (user?.vesselUnit) setVesselUnitInput(user.vesselUnit as any);
    if (user?.bodyWeight) setBodyWeightInput(user.bodyWeight.toString());
    if (user?.weightUnit) setWeightUnitInput(user.weightUnit as any);
    if (user?.privacySettings) setPrivacySettings(user.privacySettings);
    if (user?.squadId) setSquadIdInput(user.squadId);
    
    if (log?.qAndA && log.qAndA.length > 0) {
      setReflectionA(log.qAndA[0].answer);
    }
  }, [user, log]);

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
  if (user.challengeStartDate) {
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
    {/* CRITICAL FIX: pt-[calc(env(safe-area-inset-top)+1rem)] dynamically clears the iOS notch while keeping the background intact */}
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 text-neutral-50 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+1rem)] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-4 pb-32">
        
        {/* NATIVE APP HEADER */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              Gritify <span className="text-emerald-500">Command</span>
            </h1>
            <div className="inline-flex items-center gap-2 mt-1 bg-neutral-900/80 px-3 py-1 rounded-full border border-neutral-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Day {currentDay} of 75</span>
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

        {/* WORKOUT 1: OUTDOOR */}
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
              isW1Met 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
            }`}
          >
            {isW1Met ? 'Session Verified' : 'Log Outdoor Session'}
          </button>
        </div>

        {/* WORKOUT 2: INDOOR */}
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
              isW2Met 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
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
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Goal: {waterTarget} {user.vesselUnit}</p>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter text-white">{currentWaterAmountStr.toFixed(user.vesselUnit === "liters" ? 2 : 0)}</span>
              <span className="text-sm font-bold text-neutral-500 mb-1">/ {waterTarget}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => updateLog({ waterTotal: Math.max(0, (log?.waterTotal || 0) - 1) })} 
                className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:border-neutral-600 transition-all active:scale-90"
              >
                <Minus size={20} />
              </button>
              <button 
                onClick={handleAddWater} 
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isWaterMet 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400'
                }`}
              >
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
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Goal: {user.dailyReadingGoal} Pages Non-Fiction</p>
            </div>
          </div>
          <div className="flex items-end justify-between mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter text-white">{log?.readingTotal || 0}</span>
              <span className="text-sm font-bold text-neutral-500 mb-1">/ {user.dailyReadingGoal}</span>
            </div>
            <form onSubmit={handleAddPages} className="flex gap-2 w-1/2">
              <input 
                type="number" 
                name="pages" 
                required 
                placeholder="+ pgs" 
                className="w-16 bg-neutral-950 border border-neutral-800 rounded-2xl px-2 py-3 text-center text-neutral-200 font-bold focus:outline-none focus:border-emerald-500 transition-colors" 
              />
              <button 
                type="submit" 
                className={`flex-1 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${
                  isPagesMet 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-400'
                }`}
              >
                Log
              </button>
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
            <button 
              onClick={() => updateLog({ diet: log?.diet === false ? true : false })}
              className={`py-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 flex flex-col items-center justify-center gap-2 ${
                log?.diet 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-emerald-500/50"
              }`}
            >
              {log?.diet ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-neutral-600 rounded-full" />}
              Diet Perfect
            </button>
            
            <input type="file" accept="image/*" capture="user" ref={fileInputRef} className="hidden" onChange={handlePhotoUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isPhotoUploading}
              className={`py-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 flex flex-col items-center justify-center gap-2 ${
                log?.photoStorageId 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-emerald-500/50"
              }`}
            >
              {isPhotoUploading ? (
                <span className="animate-pulse flex flex-col items-center gap-2"><Camera size={20} /> Uploading...</span>
              ) : log?.photoUrl ? (
                <><CheckCircle size={20} /> Photo Secured</>
              ) : (
                <><Camera size={20} className="text-neutral-500" /> Upload Photo</>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-sm max-h-[90vh] overflow-y-auto hide-scrollbar">
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Command Settings</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest border-b border-neutral-800 pb-2 flex items-center gap-2"><Users size={14} /> Squad Network</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Enter a shared ID to link your dashboard.</p>
                  <div>
                    <input 
                      type="text" 
                      placeholder="e.g. alpha-squad"
                      value={squadIdInput} 
                      onChange={e => setSquadIdInput(e.target.value)} 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest border-b border-neutral-800 pb-2">Body Metrics</h3>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Vessel Size</label>
                      <input type="text" value={vesselSizeInput} onChange={e => setVesselSizeInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Unit</label>
                      <CustomDropdown options={[{label: "oz", value: "oz"}, {label: "ml", value: "ml"}, {label: "liters", value: "liters"}]} value={vesselUnitInput} onChange={(val) => setVesselUnitInput(val as any)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Weight <span className="lowercase text-neutral-600">(opt)*</span></label>
                      <input type="number" value={bodyWeightInput} onChange={e => setBodyWeightInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Unit</label>
                      <CustomDropdown options={[{label: "lbs", value: "lbs"}, {label: "kg", value: "kg"}]} value={weightUnitInput} onChange={(val) => setWeightUnitInput(val as any)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest border-b border-neutral-800 pb-2 flex items-center gap-2"><Shield size={14} /> Squad Privacy</h3>
                  {[
                    { key: "shareWorkouts", label: "Share Workouts" },
                    { key: "shareWater", label: "Share Hydration" },
                    { key: "shareReading", label: "Share Reading" },
                    { key: "shareDiet", label: "Share Diet Status" },
                    { key: "sharePhotos", label: "Share Photos" },
                  ].map((setting) => (
                    <label key={setting.key} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest group-hover:text-white transition-colors">{setting.label}</span>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${privacySettings[setting.key as keyof typeof privacySettings] ? 'bg-emerald-500' : 'bg-neutral-800'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${privacySettings[setting.key as keyof typeof privacySettings] ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={privacySettings[setting.key as keyof typeof privacySettings]}
                        onChange={(e) => setPrivacySettings({...privacySettings, [setting.key]: e.target.checked})}
                      />
                    </label>
                  ))}
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      const parsed = parseFloat(vesselSizeInput);
                      const bwParsed = parseFloat(bodyWeightInput);
                      if (!isNaN(parsed) && parsed > 0) {
                        updateSettings({ 
                          vesselSize: parsed, 
                          vesselUnit: vesselUnitInput,
                          privacySettings,
                          ...(isNaN(bwParsed) ? {} : { bodyWeight: bwParsed, weightUnit: weightUnitInput })
                        });
                      }
                      if (squadIdInput !== (user?.squadId || "")) {
                        joinSquad({ squadId: squadIdInput });
                      }
                      setSettingsOpen(false);
                    }}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest rounded-2xl transition-all uppercase text-[11px] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    Confirm Changes
                  </button>
                  <button 
                    onClick={() => signOut({ redirectUrl: '/' })}
                    className="w-full py-4 bg-transparent border border-red-500/30 hover:bg-red-500/10 text-red-500 font-black tracking-widest rounded-2xl transition-all mt-3 uppercase text-[11px]"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {workoutPanelOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWorkoutPanelOpen(null)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-40" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 rounded-t-[32px] p-6 z-50 flex flex-col pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Log {workoutPanelOpen === "workout1" ? "Outdoor" : "Indoor"}</h2>
                <button onClick={() => setWorkoutPanelOpen(null)} className="bg-neutral-800 p-2 rounded-full text-neutral-400 hover:text-white transition-colors"><X size={16} /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Protocol</label>
                  <CustomDropdown options={EXERCISE_OPTIONS} value={workoutType} onChange={setWorkoutType} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Duration (Min)</label>
                  <input type="number" value={workoutDuration} onChange={(e) => setWorkoutDuration(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono text-lg" />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => handleLogWorkout(workoutPanelOpen, false)} className="flex-[3] py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest rounded-2xl transition-all uppercase text-[11px] shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"><Flame size={14} /> Calc & Log</button>
                <button onClick={() => handleLogWorkout(workoutPanelOpen, true)} className="flex-[2] py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-black tracking-widest rounded-2xl transition-all uppercase text-[11px]">Skip</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}