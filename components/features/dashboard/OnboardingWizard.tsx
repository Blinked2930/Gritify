"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Activity, Users, Shield, ArrowLeft, Loader2 } from "lucide-react";
import { CustomDropdown } from "@/components/features/CustomDropdown";

export function OnboardingWizard({ user }: { user: any }) {
  const [step, setStep] = useState(1);
  const updateSettings = useMutation(api.logs.updateUserSettings);
  const joinSquad = useMutation(api.logs.joinSquad);

  const [vesselSizeInput, setVesselSizeInput] = useState("");
  const [vesselUnitInput, setVesselUnitInput] = useState<"oz" | "ml" | "liters">("oz");
  const [bodyWeightInput, setBodyWeightInput] = useState("");
  const [weightUnitInput, setWeightUnitInput] = useState<"lbs" | "kg">("lbs");
  const [squadIdInput, setSquadIdInput] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [privacySettings, setPrivacySettings] = useState<{
    shareWorkouts: "everyone" | "close_friends" | "none";
    shareWater: "everyone" | "close_friends" | "none";
    shareReading: "everyone" | "close_friends" | "none";
    shareDiet: "everyone" | "close_friends" | "none";
    sharePhotos: "everyone" | "close_friends" | "none";
    closeFriends: string[];
  }>({
    shareWorkouts: "everyone",
    shareWater: "everyone",
    shareReading: "everyone",
    shareDiet: "everyone",
    sharePhotos: "close_friends",
    closeFriends: []
  });

  const isValidVessel = vesselSizeInput.trim() !== "" && !isNaN(parseFloat(vesselSizeInput));

  const completeSetup = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const parsed = parseFloat(vesselSizeInput);
      const bwParsed = parseFloat(bodyWeightInput);
      
      await updateSettings({ 
        vesselSize: isNaN(parsed) ? 40 : parsed, 
        vesselUnit: vesselUnitInput,
        privacySettings,
        hasCompletedSetup: true,
        ...(isNaN(bwParsed) ? {} : { bodyWeight: bwParsed, weightUnit: weightUnitInput })
      });

      if (squadIdInput.trim() !== "") {
        await joinSquad({ squadId: squadIdInput });
      }

      window.location.reload();
    } catch (err) {
      console.error("Setup failed:", err);
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-50 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={28} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Initialization</h1>
          <p className="text-neutral-500 text-sm">Configure your telemetry before entering the grid.</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? "w-12 bg-emerald-500" : step > i ? "w-4 bg-emerald-500/30" : "w-4 bg-neutral-800"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 bg-neutral-900/50 p-6 rounded-3xl border border-neutral-800">
              <h2 className="text-sm font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2"><Activity size={16}/> Base Metrics</h2>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Vessel Size</label>
                  <input type="number" placeholder="e.g. 40" value={vesselSizeInput} onChange={e => setVesselSizeInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
                </div>
                <div className="w-1/3">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Unit</label>
                  <CustomDropdown options={[{label: "oz", value: "oz"}, {label: "ml", value: "ml"}, {label: "liters", value: "liters"}]} value={vesselUnitInput} onChange={(val) => setVesselUnitInput(val as any)} />
                </div>
              </div>
              <div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Weight <span className="lowercase text-neutral-600">(optional)*</span></label>
                    <input type="number" placeholder="e.g. 160" value={bodyWeightInput} onChange={e => setBodyWeightInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Unit</label>
                    <CustomDropdown options={[{label: "lbs", value: "lbs"}, {label: "kg", value: "kg"}]} value={weightUnitInput} onChange={(val) => setWeightUnitInput(val as any)} />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 font-mono mt-2 leading-tight">
                  *If provided, weight is only used to personalize your active calorie burn estimations.
                </p>
              </div>
              <button 
                onClick={() => isValidVessel && setStep(2)} 
                disabled={!isValidVessel}
                className={`w-full py-4 font-black tracking-widest rounded-2xl transition-all uppercase text-xs mt-4 ${isValidVessel ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950" : "bg-neutral-800 text-neutral-500 cursor-not-allowed"}`}
              >
                Next Step &rarr;
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 bg-neutral-900/50 p-6 rounded-3xl border border-neutral-800">
              <h2 className="text-sm font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2"><Users size={16}/> Squad Network</h2>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold leading-relaxed">Enter a shared Squad ID to link your data with an accountability group. You can leave this blank and join later.</p>
              
              <div>
                <input type="text" placeholder="e.g. alpha-squad" value={squadIdInput} onChange={e => setSquadIdInput(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm" />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="px-4 py-4 bg-neutral-800 text-white rounded-2xl hover:bg-neutral-700 transition-colors"><ArrowLeft size={18}/></button>
                <button onClick={() => setStep(3)} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest rounded-2xl transition-all uppercase text-xs">Next Step &rarr;</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 bg-neutral-900/50 p-6 rounded-3xl border border-neutral-800">
              <h2 className="text-sm font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2"><Shield size={16}/> Global Privacy</h2>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold leading-relaxed mb-4">Control what your squad can see. (You can configure specific 'Close Friends' in settings later).</p>
              
              <div className="space-y-4">
                {[
                  { key: "shareWorkouts", label: "Workouts" },
                  { key: "shareWater", label: "Hydration" },
                  { key: "shareReading", label: "Reading" },
                  { key: "shareDiet", label: "Diet Status" },
                  { key: "sharePhotos", label: "Photos" },
                ].map((setting) => (
                  <div key={setting.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">{setting.label}</span>
                    <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 gap-1 w-full sm:w-auto">
                      <button onClick={() => setPrivacySettings({...privacySettings, [setting.key]: "everyone"})} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${privacySettings[setting.key as keyof typeof privacySettings] === "everyone" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-600 hover:text-neutral-400"}`}>All</button>
                      <button onClick={() => setPrivacySettings({...privacySettings, [setting.key]: "close_friends"})} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${privacySettings[setting.key as keyof typeof privacySettings] === "close_friends" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-600 hover:text-neutral-400"}`}>Close</button>
                      <button onClick={() => setPrivacySettings({...privacySettings, [setting.key]: "none"})} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${privacySettings[setting.key as keyof typeof privacySettings] === "none" ? "bg-red-500/20 text-red-400" : "text-neutral-600 hover:text-neutral-400"}`}>None</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-6 border-t border-neutral-800">
                <button onClick={() => setStep(2)} disabled={isSubmitting} className="px-4 py-4 bg-neutral-800 text-white rounded-2xl hover:bg-neutral-700 transition-colors disabled:opacity-50"><ArrowLeft size={18}/></button>
                <button onClick={completeSetup} disabled={isSubmitting} className="flex-1 py-4 bg-gradient-to-r from-emerald-400 to-emerald-600 text-emerald-950 font-black tracking-widest rounded-2xl transition-all uppercase text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] flex justify-center items-center">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Enter Command"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}