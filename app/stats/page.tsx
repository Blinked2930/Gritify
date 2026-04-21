"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Flame, Droplet, BookOpen, Activity, Loader2, Utensils, Camera as CameraIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function StatsDashboard() {
  const me = useQuery(api.logs.getMe);
  const data = useQuery(api.logs.getGlobalAggregates);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  if (data === undefined || me === undefined) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <Activity className="w-12 h-12 text-neutral-800 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Syncing Telemetry</h2>
        <p className="text-neutral-500 text-sm">Awaiting authentication lock-in to decrypt global stats.</p>
      </div>
    );
  }

  const { userStats, partnerStats, partnerName, userLogs } = data;

  // Build the 75 block calendar
  const calendarBlocks = Array.from({ length: 75 }).map((_, i) => {
    const dayNum = i + 1;
    const sortedLogs = [...userLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const log = sortedLogs[i]; 
    
    let state = "future";
    if (log) {
      if (log.status === "failed") state = "failed";
      else if (log.status === "vouch_pending") state = "pending";
      else state = "success"; 
    }

    return { dayNum, state, log };
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-4 sm:p-6 font-sans overflow-x-hidden pb-32 relative">
      {/* Background Glowing Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-neutral-800/50 pb-6 pt-6">
          <Link href="/dashboard" className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 p-3 rounded-full hover:bg-emerald-500/10 transition-all group">
            <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              Deep <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">Analytics</span>
            </h1>
            <p className="text-neutral-500 text-sm tracking-wide">Macro telemetry across your 75-Day Protocol.</p>
          </div>
        </div>

        {/* Aggregate Scoreboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
            <h2 className="text-2xl font-black uppercase text-emerald-400 tracking-widest mb-8 flex items-center gap-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> You
            </h2>
            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-neutral-800/50 pb-4">
                <div>
                  <p className="flex items-center text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 gap-2">
                    <Flame size={14} className="text-orange-500" /> Active Calories
                  </p>
                  <p className="text-4xl font-black text-white">{userStats.totalCals.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-between items-end border-b border-neutral-800/50 pb-4">
                <div>
                  <p className="flex items-center text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 gap-2">
                    <Activity size={14} className="text-violet-500" /> Total Workouts
                  </p>
                  <p className="text-4xl font-black text-white">{userStats.workoutCount}</p>
                </div>
              </div>
              <div className="flex justify-between items-end border-b border-neutral-800/50 pb-4">
                <div>
                  <p className="flex items-center text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 gap-2">
                    <Droplet size={14} className="text-blue-500" /> Hydration ({me?.vesselUnit})
                  </p>
                  <p className="text-4xl font-black text-white">{userStats.totalWater.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-between items-end pb-2">
                <div>
                  <p className="flex items-center text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 gap-2">
                    <BookOpen size={14} className="text-amber-500" /> Intelligence (Pages)
                  </p>
                  <p className="text-4xl font-black text-white">{userStats.totalPages.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Partner Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-900/20 backdrop-blur-sm border border-neutral-800/30 rounded-3xl p-8 relative overflow-hidden"
          >
            <h2 className="text-2xl font-black uppercase text-neutral-500 tracking-widest mb-8 flex items-center gap-3 relative z-10">
              <span className="w-2 h-2 bg-neutral-600 rounded-full" /> {partnerName}
            </h2>
            {partnerStats ? (
              <div className="space-y-8 relative z-10 opacity-60 mix-blend-luminosity hover:mix-blend-normal hover:opacity-100 transition-all duration-500">
                <div className="flex justify-between items-end border-b border-neutral-800/50 pb-4">
                  <div>
                    <p className="flex items-center text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 gap-2">
                      <Flame size={14} /> Active Calories
                    </p>
                    <p className="text-4xl font-black text-neutral-300">{partnerStats.totalCals.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between items-end border-b border-neutral-800/50 pb-4">
                  <div>
                    <p className="flex items-center text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 gap-2">
                      <Activity size={14} /> Total Workouts
                    </p>
                    <p className="text-4xl font-black text-neutral-300">{partnerStats.workoutCount}</p>
                  </div>
                </div>
                <div className="flex justify-between items-end border-b border-neutral-800/50 pb-4">
                  <div>
                    <p className="flex items-center text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 gap-2">
                      <Droplet size={14} /> Hydration
                    </p>
                    <p className="text-4xl font-black text-neutral-300">{partnerStats.totalWater.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between items-end pb-2">
                  <div>
                    <p className="flex items-center text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 gap-2">
                      <BookOpen size={14} /> Intelligence
                    </p>
                    <p className="text-4xl font-black text-neutral-300">{partnerStats.totalPages.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 opacity-50 flex items-center h-full justify-center pb-12">
                <p className="font-mono text-sm tracking-widest uppercase">Awaiting Partner...</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* 75 Hard Grid Heatmap */}
        <div className="pt-8">
          <h2 className="text-2xl font-black uppercase text-white tracking-widest mb-8 text-center sm:text-left flex items-center gap-3">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse" /> The Grid
          </h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 select-none bg-neutral-900/20 p-6 rounded-3xl border border-neutral-800/30 backdrop-blur-xl pb-6 hide-scrollbar relative">
            {calendarBlocks.map((block, idx) => {
              let bgClass = "bg-neutral-900 border-neutral-800 text-neutral-700 hover:bg-neutral-800/80";
              
              if (block.state === "success") {
                bgClass = "bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)] text-emerald-950 hover:brightness-110 hover:-translate-y-1 z-10 relative after:absolute after:inset-0 after:rounded-[14px] after:shadow-[inset_0_1px_rgba(255,255,255,0.4)]";
              }
              if (block.state === "pending") {
                bgClass = "bg-gradient-to-b from-amber-400 to-amber-600 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-amber-950 hover:brightness-110 hover:-translate-y-1 z-10 relative after:absolute after:inset-0 after:rounded-[14px] after:shadow-[inset_0_1px_rgba(255,255,255,0.4)]";
              }
              if (block.state === "failed") {
                bgClass = "bg-red-500/10 border-red-500/30 text-red-500/60 hover:bg-red-500/20 hover:-translate-y-1 z-10 relative";
              }

              // Only animate the blocks close to the viewport to save performance
              const isRecent = idx < 15;

              return (
                <motion.button 
                  key={block.dayNum} 
                  initial={isRecent ? { opacity: 0, scale: 0.8 } : false}
                  animate={isRecent ? { opacity: 1, scale: 1 } : false}
                  transition={{ delay: idx * 0.02 }}
                  disabled={block.state === "future"}
                  onClick={() => block.log && setSelectedLog({ ...block.log, dayNum: block.dayNum })}
                  className={`flex-shrink-0 snap-center w-14 h-14 sm:w-16 sm:h-16 relative rounded-2xl border border-b-[3px] flex items-center justify-center transition-all duration-300 font-extrabold text-lg sm:text-xl tracking-tighter ${bgClass}`}
                >
                  <span className="relative z-20">{block.dayNum}</span>
                </motion.button>
              );
            })}
            
            {/* Fade Out Gradient for Scrolling Edge */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-neutral-900/60 to-transparent pointer-events-none rounded-r-3xl" />
          </div>
        </div>
      </div>

      {/* Deep Drilldown Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedLog(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl relative z-10 w-full max-w-md max-h-[85vh] overflow-y-auto hide-scrollbar"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Day {selectedLog.dayNum}</h2>
                  <p className="text-emerald-500 font-bold text-sm tracking-widest uppercase mt-1">{selectedLog.date}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5 rotate-[-45deg]" />
                </button>
              </div>
              
              <div className="space-y-4">
                
                {/* Visual Demarcation Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-blue-500/50 transition-colors">
                    <Droplet size={18} className="text-blue-500/80 group-hover:text-blue-400" />
                    <span className="font-black text-white text-xl">{(selectedLog.waterTotal * (me?.vesselSize || 1)).toFixed((me?.vesselUnit === 'liters') ? 2 : 0)}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{me?.vesselUnit || 'oz'}</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-amber-500/50 transition-colors">
                    <BookOpen size={18} className="text-amber-500/80 group-hover:text-amber-400" />
                    <span className="font-black text-white text-xl">{selectedLog.readingTotal}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Pages</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-emerald-500/50 transition-colors">
                    <Utensils size={18} className={selectedLog.diet ? "text-emerald-500/80" : "text-red-500/80"} />
                    <span className="font-black text-white text-sm mt-1">{selectedLog.diet ? "CLEAN" : "DIRTY"}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Diet</span>
                  </div>
                </div>

                {/* Granular Block: Workouts */}
                <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center"><Flame size={14} className="text-orange-500 mr-2"/> Outdoor Movement</p>
                  <p className="text-white font-black text-lg tracking-tight uppercase">{selectedLog.workout1.notes || "Standard"}</p>
                  <div className="flex mt-2 items-center gap-2">
                    <span className="bg-orange-500/10 text-orange-500 font-black tracking-widest text-[10px] px-2 py-1 rounded border border-orange-500/20">{selectedLog.workout1.cals || 0} KCAL</span>
                    {selectedLog.workout1.done && <span className="bg-emerald-500/10 text-emerald-500 font-black tracking-widest text-[10px] px-2 py-1 rounded border border-emerald-500/20">VERIFIED</span>}
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors" />
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center"><Activity size={14} className="text-violet-500 mr-2"/> Indoor Movement</p>
                  <p className="text-white font-black text-lg tracking-tight uppercase">{selectedLog.workout2.notes || "Standard"}</p>
                  <div className="flex mt-2 items-center gap-2">
                    <span className="bg-violet-500/10 text-violet-500 font-black tracking-widest text-[10px] px-2 py-1 rounded border border-violet-500/20">{selectedLog.workout2.cals || 0} KCAL</span>
                    {selectedLog.workout2.done && <span className="bg-emerald-500/10 text-emerald-500 font-black tracking-widest text-[10px] px-2 py-1 rounded border border-emerald-500/20">VERIFIED</span>}
                  </div>
                </div>
                
                {/* Vault Reflection */}
                {selectedLog.qAndA && selectedLog.qAndA.length > 0 && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">Vault Reflection</p>
                    <p className="text-neutral-400 text-xs italic mb-3">"{selectedLog.qAndA[0].question}"</p>
                    <p className="text-white font-mono text-sm leading-relaxed border-l-2 border-emerald-500/30 pl-4">{selectedLog.qAndA[0].answer}</p>
                  </div>
                )}

                {/* Progress Picture Indicator */}
                {selectedLog.photoStorageId && (
                  <div className="flex items-center justify-center p-4 rounded-xl border border-dashed border-neutral-700 text-neutral-500 gap-2">
                    <CameraIcon size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Progress Visual Secured</span>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
