"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Flame, Droplet, BookOpen, Activity, Loader2, Utensils, ShieldAlert, User, CheckCircle, Camera, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function SquadDirectoryDashboard() {
  const me = useQuery(api.logs.getMe);
  const data = useQuery(api.logs.getGlobalAggregates);
  
  const [selectedUserDetailed, setSelectedUserDetailed] = useState<any | null>(null);
  const [selectedLogDay, setSelectedLogDay] = useState<any | null>(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null); // NEW: State for full screen photo

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

                  <div className="flex items-center justify-between w-full bg-neutral-950/50 p-2 rounded-xl border border-neutral-800/50">
                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isW1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        <Flame size={12} />
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">W1</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isW2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        <Activity size={12} />
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">W2</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isWater ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        <Droplet size={12} />
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">H2O</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isRead ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        <BookOpen size={12} />
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">Read</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDiet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
                        <Utensils size={12} />
                      </div>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-500">Diet</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group/item">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isPhoto ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                        <Camera size={12} />
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
          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
            <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Flame size={12} className="text-orange-500" /> Cals</p>
            {targetUser.privacySettings?.shareWorkouts !== false ? (
              <p className="text-2xl font-black text-white">{targetStats?.totalCals?.toLocaleString() || 0}</p>
            ) : (
              <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>
            )}
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
            <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Activity size={12} className="text-violet-500" /> Workouts</p>
            {targetUser.privacySettings?.shareWorkouts !== false ? (
              <p className="text-2xl font-black text-white">{targetStats?.workoutCount || 0}</p>
            ) : (
              <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>
            )}
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
            <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Droplet size={12} className="text-blue-500" /> Water</p>
            {targetUser.privacySettings?.shareWater !== false ? (
              <p className="text-2xl font-black text-white">{targetStats?.totalWater?.toLocaleString() || 0}</p>
            ) : (
              <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>
            )}
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
            <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><BookOpen size={12} className="text-amber-500" /> Pages</p>
            {targetUser.privacySettings?.shareReading !== false ? (
              <p className="text-2xl font-black text-white">{targetStats?.totalPages?.toLocaleString() || 0}</p>
            ) : (
              <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>
            )}
          </div>
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
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedLogDay(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-md max-h-[85vh] overflow-y-auto hide-scrollbar"
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
                  {/* Water Block */}
                  <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <Droplet size={14} className={selectedLogDay.waterTotal > 0 ? "text-blue-500" : "text-neutral-600"} />
                    {targetUser.privacySettings?.shareWater !== false ? (
                      <span className="font-black text-white text-base">{(selectedLogDay.waterTotal * (targetUser.vesselSize || 1)).toFixed(0)}</span>
                    ) : (
                      <span className="text-[10px] text-neutral-600 font-bold uppercase mt-1">Hidden</span>
                    )}
                  </div>

                  {/* Reading Block */}
                  <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <BookOpen size={14} className={selectedLogDay.readingTotal > 0 ? "text-amber-500" : "text-neutral-600"} />
                    {targetUser.privacySettings?.shareReading !== false ? (
                      <span className="font-black text-white text-base">{selectedLogDay.readingTotal}</span>
                    ) : (
                      <span className="text-[10px] text-neutral-600 font-bold uppercase mt-1">Hidden</span>
                    )}
                  </div>

                  {/* Diet Block */}
                  <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <Utensils size={14} className={selectedLogDay.diet ? "text-emerald-500" : "text-red-500"} />
                    {targetUser.privacySettings?.shareDiet !== false ? (
                      <span className="font-black text-white text-xs mt-1">{selectedLogDay.diet ? "CLEAN" : "DIRTY"}</span>
                    ) : (
                      <span className="text-[10px] text-neutral-600 font-bold uppercase mt-1">Hidden</span>
                    )}
                  </div>
                </div>

                {/* Workout 1 */}
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center"><Flame size={12} className="text-orange-500 mr-2"/> Outdoor</p>
                    {selectedLogDay.workout1.done ? <CheckCircle size={14} className="text-emerald-500" /> : <X size={14} className="text-neutral-600" />}
                  </div>
                  {targetUser.privacySettings?.shareWorkouts !== false ? (
                    <>
                      <p className="text-white font-black text-base tracking-tight uppercase">{selectedLogDay.workout1.notes || "Standard"}</p>
                      <div className="flex mt-2 items-center gap-2">
                        <span className="bg-orange-500/10 text-orange-500 font-black tracking-widest text-[8px] px-2 py-1 rounded border border-orange-500/20">{selectedLogDay.workout1.cals || 0} KCAL</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-neutral-600 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-1"><ShieldAlert size={10}/> Details Hidden</p>
                  )}
                </div>

                {/* Workout 2 */}
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center"><Activity size={12} className="text-violet-500 mr-2"/> Indoor</p>
                    {selectedLogDay.workout2.done ? <CheckCircle size={14} className="text-emerald-500" /> : <X size={14} className="text-neutral-600" />}
                  </div>
                  {targetUser.privacySettings?.shareWorkouts !== false ? (
                    <>
                      <p className="text-white font-black text-base tracking-tight uppercase">{selectedLogDay.workout2.notes || "Standard"}</p>
                      <div className="flex mt-2 items-center gap-2">
                        <span className="bg-violet-500/10 text-violet-500 font-black tracking-widest text-[8px] px-2 py-1 rounded border border-violet-500/20">{selectedLogDay.workout2.cals || 0} KCAL</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-neutral-600 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-1"><ShieldAlert size={10}/> Details Hidden</p>
                  )}
                </div>

                {/* Photo Rendering */}
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center"><Camera size={12} className="text-emerald-500 mr-2"/> Progress Photo</p>
                    {selectedLogDay.photoStorageId ? <CheckCircle size={14} className="text-emerald-500" /> : <X size={14} className="text-neutral-600" />}
                  </div>
                  
                  {selectedLogDay.photoStorageId && (
                    targetUser.privacySettings?.sharePhotos && selectedLogDay.photoUrl ? (
                      <div 
                        onClick={() => setExpandedPhotoUrl(selectedLogDay.photoUrl)}
                        className="mt-3 relative w-full h-48 rounded-lg overflow-hidden border border-neutral-800 cursor-pointer group/img"
                      >
                        <img src={selectedLogDay.photoUrl} alt="Progress" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover/img:opacity-100 text-white font-bold text-xs tracking-widest uppercase bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm transition-opacity">Expand</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-center h-24 border border-dashed border-neutral-800 rounded-lg gap-2 text-neutral-600">
                        <ShieldAlert size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Image Hidden</span>
                      </div>
                    )
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN PHOTO VIEWER */}
      <AnimatePresence>
        {expandedPhotoUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
              onClick={() => setExpandedPhotoUrl(null)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
            >
              <button 
                onClick={() => setExpandedPhotoUrl(null)} 
                className="absolute top-4 right-4 p-3 bg-neutral-800/80 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors z-20 backdrop-blur-md"
              >
                <X size={24} />
              </button>
              <img 
                src={expandedPhotoUrl} 
                alt="Full Screen Progress" 
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}