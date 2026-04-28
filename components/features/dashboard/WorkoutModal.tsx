"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { X, Flame } from "lucide-react";
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

export function WorkoutModal({ user, type, onClose }: { user: any, type: "workout1" | "workout2", onClose: () => void }) {
  const updateLog = useMutation(api.logs.updateLog);
  const [workoutType, setWorkoutType] = useState("running");
  const [workoutDuration, setWorkoutDuration] = useState("45");

  const handleLogWorkout = async (isQuick: boolean) => {
    if (isQuick) {
      await updateLog({ [`${type}Done`]: true } as any);
    } else {
      const selected = EXERCISE_OPTIONS.find(o => o.value === workoutType);
      const met = selected?.met || 5.0;
      
      const userWeightUnit = user?.weightUnit || "lbs";
      const weightMultiplier = userWeightUnit === "kg" ? 1 : 0.453592;
      const weightKg = (user?.bodyWeight || 150) * weightMultiplier;
      
      const durationHours = (parseFloat(workoutDuration) || 45) / 60;
      const calsBurned = Math.round(met * weightKg * durationHours);
      
      if (type === "workout1") {
        await updateLog({ workout1: { done: true, notes: selected?.label || "Other", cals: calsBurned } });
      } else {
        await updateLog({ workout2: { done: true, notes: selected?.label || "Other", cals: calsBurned } });
      }
    }
    onClose();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md z-40" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 rounded-t-[32px] p-6 z-50 flex flex-col pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-black text-white uppercase tracking-widest">Log {type === "workout1" ? "Outdoor" : "Indoor"}</h2>
          <button onClick={onClose} className="bg-neutral-800 p-2 rounded-full text-neutral-400 hover:text-white transition-colors"><X size={16} /></button>
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
          <button onClick={() => handleLogWorkout(false)} className="flex-[3] py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest rounded-2xl transition-all uppercase text-[11px] shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"><Flame size={14} /> Calc & Log</button>
          <button onClick={() => handleLogWorkout(true)} className="flex-[2] py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-black tracking-widest rounded-2xl transition-all uppercase text-[11px]">Skip</button>
        </div>
      </motion.div>
    </>
  );
}