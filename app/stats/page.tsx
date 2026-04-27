"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Flame, Droplet, BookOpen, Activity, Loader2, Utensils, ShieldAlert, User, CheckCircle, Camera } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function SquadDirectoryDashboard() {
  const me = useQuery(api.logs.getMe);
  const data = useQuery(api.logs.getGlobalAggregates);
  
  const [selectedUserDetailed, setSelectedUserDetailed] = useState<any | null>(null);
  const [selectedLogDay, setSelectedLogDay] = useState<any | null>(null);

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

  const rawSquadArray = data.squad || []; 
  const fullSquadList = [
    {
      user: { ...me, name: "You" },
      stats: data.userStats,
      logs: data.userLogs,
      isMe: true
    },
    ...rawSquadArray
  ];

  // Helper to get exactly today's log to power the dot-matrix
  const getTodayLogForUser = (logs: any[]) => {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    const todayStr = now.toISOString().split("T")[0];
    return logs.find(l => l.date === todayStr);
  };

  // ==========================================
  // VIEW 1: SQUAD DIRECTORY (Mobile First Grid)
  // ==========================================
  if (!selectedUserDetailed) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 p-4 sm:p-6 font-sans overflow-x-hidden pb-32 relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex items-center gap-4 border-b border-neutral-800/50 pb-6 pt-4">
            <Link href="/dashboard" className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 p-3 rounded-full hover:bg-emerald-500/10 transition-all group">
              <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                Squad <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">Grid</span>
              </h1>
              <p className="text-neutral-500 text-xs tracking-wide uppercase">Live Daily Protocol Status</p>
            </div>
          </div>

          <div className="space-y-3">
            {fullSquadList.map((member, idx) => {
              const todayLog = getTodayLogForUser(member.logs || []);
              const u = member.user;
              const waterTarget = u.vesselUnit === "liters" ? 3.78 : u.vesselUnit === "ml" ? 3785 : 128;
              const currentWater = todayLog ? (todayLog.waterTotal * (u.vesselSize || 1)) : 0;
              
              const isW1 = todayLog?.workout1?.done;
              const isW2 = todayLog?.workout2?.done;
              const isWater = currentWater >= waterTarget;
              const isRead = todayLog ? todayLog.readingTotal >= u.dailyReadingGoal : false;
              const isDiet = todayLog?.diet;
              const isPhoto = todayLog?.photoStorageId;

              return (
                <motion.button
                  key={member.user._id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedUserDetailed(member)}
                  className={`w-full bg-neutral-900/60 backdrop-blur-md border rounded-2xl p-4 text-left relative overflow-hidden group transition-all flex flex-col gap-3 ${member.isMe ? 'border-emerald-500/30' : 'border-neutral-800'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <h2 className="text-base font-black uppercase text-white tracking-widest flex items-center gap-2">
                      {member.isMe ? <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> : <User size={14} className="text-neutral-500" />}
                      {member.user.name}
                    </h2>
                    <span className="text-[9px] text-neutral-600 uppercase tracking-widest font-bold">Deep Dive &rarr;</span>
                  </div>

                  {/* The Mobile-First Dot Matrix */}
                  <div className="flex items-center justify-between w-full bg-neutral-950/50 p-2 rounded-xl border border-neutral-800/50">
                    
                    {/* W1 */}
                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${u.privacySettings?.shareWorkouts === false ? 'bg-neutral-900 text-neutral-700' : isW1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        {u.privacySettings?.shareWorkouts === false ? <ShieldAlert size={10} /> : <Flame size={12} />}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">W1</span>
                    </div>

                    {/* W2 */}
                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${u.privacySettings?.shareWorkouts === false ? 'bg-neutral-900 text-neutral-700' : isW2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        {u.privacySettings?.shareWorkouts === false ? <ShieldAlert size={10} /> : <Activity size={12} />}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">W2</span>
                    </div>

                    {/* Water */}
                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${u.privacySettings?.shareWater === false ? 'bg-neutral-900 text-neutral-700' : isWater ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        {u.privacySettings?.shareWater === false ? <ShieldAlert size={10} /> : <Droplet size={12} />}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">H2O</span>
                    </div>

                    {/* Read */}
                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${u.privacySettings?.shareReading === false ? 'bg-neutral-900 text-neutral-700' : isRead ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        {u.privacySettings?.shareReading === false ? <ShieldAlert size={10} /> : <BookOpen size={12} />}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">Read</span>
                    </div>

                    {/* Diet */}
                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${u.privacySettings?.shareDiet === false ? 'bg-neutral-900 text-neutral-700' : isDiet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
                        {u.privacySettings?.shareDiet === false ? <ShieldAlert size={10} /> : <Utensils size={12} />}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">Diet</span>
                    </div>

                    {/* Photo */}
                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${u.privacySettings?.sharePhotos === false ? 'bg-neutral-900 text-neutral-700' : isPhoto ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        {u.privacySettings?.sharePhotos === false ? <ShieldAlert size={10} /> : <Camera size={12} />}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">Pic</span>
                    </div>

                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: DEEP DIVE (Selected User)
  // ==========================================
  const targetUser = selectedUserDetailed.user;
  const targetStats = selectedUserDetailed.stats;
  const targetLogs = selectedUserDetailed.logs || [];
  const isMe = selectedUserDetailed.isMe;

  const calendarBlocks = Array.from({ length: 75 }).map((_, i) => {
    const dayNum = i + 1;
    const sortedLogs = [...targetLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        <div className="flex items-center gap-4 border-b border-neutral-800/50 pb-6 pt-4">
          <button onClick={() => setSelectedUserDetailed(null)} className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 p-3 rounded-full hover:bg-emerald-500/10 transition-all group">
            <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">{targetUser.name}'s</span> Grid
            </h1>
            {!isMe && <p className="text-neutral-500 text-[10px] tracking-widest uppercase mt-1">Respecting Privacy Toggles</p>}
          </div>
        </div>

        {/* Aggregate Stats (Filtered by Privacy) */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {targetUser.privacySettings?.shareWorkouts !== false ? (
            <>
              <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
                <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Flame size={12} className="text-orange-500" /> Cals</p>
                <p className="text-2xl font-black text-white">{targetStats?.totalCals?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
                <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Activity size={12} className="text-violet-500" /> Workouts</p>
                <p className="text-2xl font-black text-white">{targetStats?.workoutCount || 0}</p>
              </div>
            </>
          ) : (
            <div className="col-span-2 flex items-center border border-dashed border-neutral-800 rounded-xl p-4 text-neutral-600 bg-neutral-950/50">
              <ShieldAlert size={16} className="mr-2" /> Workouts Masked
            </div>
          )}

          {targetUser.privacySettings?.shareWater !== false ? (
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
              <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Droplet size={12} className="text-blue-500" /> Water</p>
              <p className="text-2xl font-black text-white">{targetStats?.totalWater?.toLocaleString() || 0}</p>
            </div>
          ) : (
            <div className="flex items-center border border-dashed border-neutral-800 rounded-xl p-4 text-neutral-600 bg-neutral-950/50">
              <ShieldAlert size={16} className="mr-2" /> Water Masked
            </div>
          )}

          {targetUser.privacySettings?.shareReading !== false ? (
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
              <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><BookOpen size={12} className="text-amber-500" /> Pages</p>
              <p className="text-2xl font-black text-white">{targetStats?.totalPages?.toLocaleString() || 0}</p>
            </div>
          ) : (
            <div className="flex items-center border border-dashed border-neutral-800 rounded-xl p-4 text-neutral-600 bg-neutral-950/50">
              <ShieldAlert size={16} className="mr-2"/> Pages Masked
            </div>
          )}
        </div>

        {/* Heatmap Grid */}
        <div className="pt-2">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 select-none bg-neutral-900/20 p-5 rounded-3xl border border-neutral-800/30 backdrop-blur-xl pb-5 hide-scrollbar relative">
            {calendarBlocks.map((block, idx) => {
              let bgClass = "bg-neutral-900 border-neutral-800 text-neutral-700 hover:bg-neutral-800/80";
              if (block.state === "success") {
                bgClass = "bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)] text-emerald-950 hover:brightness-110 z-10 relative";
              }
              if (block.state === "pending") {
                bgClass = "bg-gradient-to-b from-amber-400 to-amber-600 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-amber-950 hover:brightness-110 z-10 relative";
              }
              if (block.state === "failed") {
                bgClass = "bg-red-500/10 border-red-500/30 text-red-500/60 hover:bg-red-500/20 z-10 relative";
              }

              return (
                <motion.button 
                  key={block.dayNum} 
                  initial={idx < 15 ? { opacity: 0, scale: 0.8 } : false}
                  animate={idx < 15 ? { opacity: 1, scale: 1 } : false}
                  transition={{ delay: idx * 0.02 }}
                  disabled={block.state === "future"}
                  onClick={() => block.log && setSelectedLogDay({ ...block.log, dayNum: block.dayNum })}
                  className={`flex-shrink-0 snap-center w-12 h-12 relative rounded-xl border border-b-[3px] flex items-center justify-center transition-all duration-300 font-extrabold text-lg tracking-tighter ${bgClass}`}
                >
                  <span className="relative z-20">{block.dayNum}</span>
                </motion.button>
              );
            })}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-neutral-900/60 to-transparent pointer-events-none rounded-r-3xl" />
          </div>
        </div>
      </div>

      {/* Individual Day Modal */}
      <AnimatePresence>
        {selectedLogDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedLogDay(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-sm max-h-[85vh] overflow-y-auto hide-scrollbar"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Day {selectedLogDay.dayNum}</h2>
                  <p className="text-emerald-500 font-bold text-xs tracking-widest uppercase mt-1">{selectedLogDay.date}</p>
                </div>
                <button onClick={() => setSelectedLogDay(null)} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5 rotate-[-45deg]" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {targetUser.privacySettings?.shareWater !== false ? (
                    <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                      <Droplet size={14} className="text-blue-500/80" />
                      <span className="font-black text-white text-base">{(selectedLogDay.waterTotal * (targetUser.vesselSize || 1)).toFixed((targetUser.vesselUnit === 'liters') ? 2 : 0)}</span>
                    </div>
                  ) : (
                    <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex items-center justify-center"><ShieldAlert size={14} className="text-neutral-700"/></div>
                  )}

                  {targetUser.privacySettings?.shareReading !== false ? (
                    <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                      <BookOpen size={14} className="text-amber-500/80" />
                      <span className="font-black text-white text-base">{selectedLogDay.readingTotal}</span>
                    </div>
                  ) : (
                    <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex items-center justify-center"><ShieldAlert size={14} className="text-neutral-700"/></div>
                  )}

                  {targetUser.privacySettings?.shareDiet !== false ? (
                    <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                      <Utensils size={14} className={selectedLogDay.diet ? "text-emerald-500/80" : "text-red-500/80"} />
                      <span className="font-black text-white text-xs mt-1">{selectedLogDay.diet ? "CLEAN" : "DIRTY"}</span>
                    </div>
                  ) : (
                    <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex items-center justify-center"><ShieldAlert size={14} className="text-neutral-700"/></div>
                  )}
                </div>

                {targetUser.privacySettings?.shareWorkouts !== false && (
                  <>
                    <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl relative overflow-hidden group">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center"><Flame size={12} className="text-orange-500 mr-2"/> Outdoor</p>
                      <p className="text-white font-black text-base tracking-tight uppercase">{selectedLogDay.workout1.notes || "Standard"}</p>
                      <div className="flex mt-2 items-center gap-2">
                        <span className="bg-orange-500/10 text-orange-500 font-black tracking-widest text-[8px] px-2 py-1 rounded border border-orange-500/20">{selectedLogDay.workout1.cals || 0} KCAL</span>
                        {selectedLogDay.workout1.done && <span className="bg-emerald-500/10 text-emerald-500 font-black tracking-widest text-[8px] px-2 py-1 rounded border border-emerald-500/20">VERIFIED</span>}
                      </div>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl relative overflow-hidden group">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center"><Activity size={12} className="text-violet-500 mr-2"/> Indoor</p>
                      <p className="text-white font-black text-base tracking-tight uppercase">{selectedLogDay.workout2.notes || "Standard"}</p>
                      <div className="flex mt-2 items-center gap-2">
                        <span className="bg-violet-500/10 text-violet-500 font-black tracking-widest text-[8px] px-2 py-1 rounded border border-violet-500/20">{selectedLogDay.workout2.cals || 0} KCAL</span>
                        {selectedLogDay.workout2.done && <span className="bg-emerald-500/10 text-emerald-500 font-black tracking-widest text-[8px] px-2 py-1 rounded border border-emerald-500/20">VERIFIED</span>}
                      </div>
                    </div>
                  </>
                )}

                {targetUser.privacySettings?.sharePhotos && selectedLogDay.photoStorageId && (
                  <div className="flex items-center justify-center p-3 rounded-xl border border-dashed border-emerald-900/50 bg-emerald-500/5 text-emerald-500 gap-2">
                    <CheckCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Visual Confirmed</span>
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