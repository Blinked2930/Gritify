"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Flame, Droplet, BookOpen, Activity, Loader2, Utensils, ShieldAlert, User, CheckCircle, Camera, X, History } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// UNIVERSAL TRANSLATOR: Converts any water amount from the logger's unit to the viewer's unit
const convertWater = (amount: number, fromUnit: string, toUnit: string) => {
  if (!amount) return 0;
  const from = (fromUnit || "oz").toLowerCase();
  const to = (toUnit || "oz").toLowerCase();
  
  if (from === to) return amount;

  // Step 1: Normalize everything to milliliters as a base
  let baseMl = amount;
  if (from === "oz") baseMl = amount * 29.5735;
  else if (from === "liters") baseMl = amount * 1000;

  // Step 2: Convert from base milliliters to the viewer's preferred unit
  if (to === "oz") return baseMl / 29.5735;
  if (to === "liters") return baseMl / 1000;
  
  return baseMl; // Default return in ml if requested
};

export default function SquadDirectoryDashboard() {
  const me = useQuery(api.logs.getMe);
  const data = useQuery(api.logs.getGlobalAggregates);
  
  const [selectedUserDetailed, setSelectedUserDetailed] = useState<any | null>(null);
  const [selectedLogDay, setSelectedLogDay] = useState<any | null>(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);

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

  const myUnit = me.vesselUnit || "oz";
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

  if (!selectedUserDetailed) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] sm:px-6 sm:pb-6 sm:pt-[calc(env(safe-area-inset-top)+24px)] font-sans overflow-x-hidden pb-32 relative">
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

          <div className="space-y-4">
            {fullSquadList.map((member, idx) => {
              const todayLog = getTodayLogForUser(member.logs || []);
              const u = member.user;
              
              // Determine success state using the target user's native unit parameters
              const waterTarget = u?.vesselUnit === "liters" ? 3.78 : u?.vesselUnit === "ml" ? 3785 : 128;
              const currentWater = todayLog ? (todayLog?.waterTotal || 0) : 0;
              
              const isW1 = todayLog?.workout1?.done;
              const isW2 = todayLog?.workout2?.done;
              const isWater = currentWater >= waterTarget;
              const isRead = todayLog ? (todayLog?.readingTotal || 0) >= (u?.dailyReadingGoal || 10) : false;
              const isDiet = todayLog?.diet;
              const isPhoto = todayLog?.photoStorageId;

              return (
                <motion.button
                  key={member.user._id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedUserDetailed(member)}
                  className={`w-full bg-neutral-900/60 backdrop-blur-md border rounded-3xl p-5 text-left relative overflow-hidden group transition-all flex flex-col gap-4 ${member.isMe ? 'border-emerald-500/30' : 'border-neutral-800'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <h2 className="text-base font-black uppercase text-white tracking-widest flex items-center gap-2">
                      {member.isMe ? <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> : <User size={14} className="text-neutral-500" />}
                      {member.user.name}
                    </h2>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold group-hover:text-emerald-400 transition-colors">Deep Dive &rarr;</span>
                  </div>

                  <div className="flex items-center justify-between w-full bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/80">
                    <div className="flex flex-col items-center gap-1.5 group/item">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isW1 ? 'bg-orange-500/20 text-orange-500' : 'bg-neutral-800 text-neutral-400'}`}>
                        <Flame size={14} />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 group/item">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isW2 ? 'bg-violet-500/20 text-violet-500' : 'bg-neutral-800 text-neutral-400'}`}>
                        <Activity size={14} />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 group/item">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isWater ? 'bg-blue-500/20 text-blue-500' : 'bg-neutral-800 text-neutral-400'}`}>
                        <Droplet size={14} />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 group/item">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isRead ? 'bg-amber-500/20 text-amber-500' : 'bg-neutral-800 text-neutral-400'}`}>
                        <BookOpen size={14} />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 group/item">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDiet ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        <Utensils size={14} />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 group/item">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPhoto ? 'bg-cyan-500/20 text-cyan-500' : 'bg-neutral-800 text-neutral-400'}`}>
                        <Camera size={14} />
                      </div>
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
  const allTargetLogs = selectedUserDetailed.logs || [];
  const isMe = selectedUserDetailed.isMe;

  const challengeStart = targetUser.challengeStartDate ? new Date(targetUser.challengeStartDate) : new Date(0);
  challengeStart.setHours(0,0,0,0);

  const currentLogs = allTargetLogs.filter((l: any) => new Date(l.date) >= challengeStart);
  const historyLogs = allTargetLogs.filter((l: any) => new Date(l.date) < challengeStart).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const checkAccess = (setting: any) => {
    if (isMe) return true;
    if (setting === true || setting === "everyone" || setting === undefined) return true;
    if (setting === "close_friends") {
      return targetUser.privacySettings?.closeFriends?.includes(me._id as string) || false;
    }
    return false;
  };

  const canViewWorkouts = checkAccess(targetUser.privacySettings?.shareWorkouts);
  const canViewWater = checkAccess(targetUser.privacySettings?.shareWater);
  const canViewReading = checkAccess(targetUser.privacySettings?.shareReading);
  const canViewDiet = checkAccess(targetUser.privacySettings?.shareDiet);
  const canViewPhotos = checkAccess(targetUser.privacySettings?.sharePhotos);

  const targetNativeWaterUnit = targetUser?.vesselUnit || "oz";
  const targetNativeWaterGoal = targetUser?.vesselUnit === "liters" ? 3.78 : targetUser?.vesselUnit === "ml" ? 3785 : 128;
  const readingTarget = targetUser?.dailyReadingGoal || 10;

  const generateBlockState = (log: any, isHistory = false) => {
    if (!log) return "future";
    
    const currentWater = (log.waterTotal || 0);
    const isW1 = !!log.workout1?.done;
    const isW2 = !!log.workout2?.done;
    const isWater = currentWater >= targetNativeWaterGoal;
    const isRead = (log.readingTotal || 0) >= readingTarget;
    const isDiet = !!log.diet;
    const isPhoto = !!log.photoStorageId;
    
    const isPerfectDay = isW1 && isW2 && isWater && isRead && isDiet && isPhoto;

    if (log.status === "failed") return "failed";
    if (isPerfectDay) return isHistory ? "history_success" : "success";
    return isHistory ? "history_pending" : "pending"; 
  };

  const calendarBlocks = Array.from({ length: 75 }).map((_, i) => {
    const dayNum = i + 1;
    const sortedLogs = [...currentLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const log = sortedLogs[i]; 
    return { dayNum, state: generateBlockState(log), log };
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] sm:px-6 sm:pb-6 sm:pt-[calc(env(safe-area-inset-top)+24px)] font-sans overflow-x-hidden pb-32 relative">
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

        {/* Lifetime Stats */}
        <div>
          <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14}/> Lifetime Aggregate Telemetry</h3>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
              <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Flame size={12} className="text-orange-500" /> Cals</p>
              {canViewWorkouts ? (
                <p className="text-2xl font-black text-white">{targetStats?.totalCals?.toLocaleString() || 0}</p>
              ) : (
                <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>
              )}
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
              <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Activity size={12} className="text-violet-500" /> Workouts</p>
              {canViewWorkouts ? (
                <p className="text-2xl font-black text-white">{targetStats?.workoutCount || 0}</p>
              ) : (
                <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>
              )}
            </div>

            {/* CRITICAL FEATURE: Universal Translation. Convert partner's raw water into my native unit */}
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
              <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Droplet size={12} className="text-blue-500" /> Water ({myUnit})</p>
              {canViewWater ? (
                <p className="text-2xl font-black text-white">
                  {convertWater(targetStats?.totalWater || 0, targetNativeWaterUnit, myUnit).toLocaleString(undefined, {maximumFractionDigits: 1})}
                </p>
              ) : (
                <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>
              )}
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
              <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><BookOpen size={12} className="text-amber-500" /> Pages</p>
              {canViewReading ? (
                <p className="text-2xl font-black text-white">{targetStats?.totalPages?.toLocaleString() || 0}</p>
              ) : (
                <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>
              )}
            </div>
          </div>
        </div>

        {/* CURRENT 75-DAY GRID */}
        <div>
          <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle size={14}/> Active 75-Day Protocol</h3>
          <div className="bg-neutral-900/20 p-5 rounded-3xl border border-neutral-800/30 backdrop-blur-xl">
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {calendarBlocks.map((block, idx) => {
                const log = block.log;
                const currentWater = log ? (log.waterTotal || 0) : 0;
                
                const isW1 = log?.workout1?.done;
                const isW2 = log?.workout2?.done;
                const isWater = currentWater >= targetNativeWaterGoal;
                const isRead = log && (log.readingTotal || 0) >= readingTarget;
                const isDiet = log?.diet;
                const isPhoto = log?.photoStorageId;

                let blockBg = "bg-neutral-900/50 border-neutral-800 text-neutral-600";
                if (block.state === "success") {
                  blockBg = "bg-gradient-to-b from-emerald-500/20 to-emerald-900/40 border-emerald-500/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]"; 
                } else if (block.state === "pending") {
                  blockBg = "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"; 
                } else if (block.state === "failed") {
                  blockBg = "bg-red-950/30 border-red-900/50 text-red-500";
                }

                return (
                  <motion.button 
                    key={block.dayNum} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (idx % 14) * 0.02 }}
                    disabled={block.state === "future"}
                    onClick={() => block.log && setSelectedLogDay({ ...block.log, dayNum: block.dayNum })}
                    className={`relative w-full aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-300 font-extrabold text-xs sm:text-sm tracking-tighter ${blockBg} overflow-hidden`}
                  >
                    <span className="relative z-20 mb-2">{block.dayNum}</span>
                    
                    {block.state !== "future" && (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-[1px] h-1 sm:h-1.5">
                        <div className={`flex-1 rounded-sm transition-colors ${isW1 ? 'bg-orange-500' : 'bg-neutral-800/80'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isW2 ? 'bg-violet-500' : 'bg-neutral-800/80'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isWater ? 'bg-blue-500' : 'bg-neutral-800/80'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isRead ? 'bg-amber-500' : 'bg-neutral-800/80'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isDiet ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isPhoto ? 'bg-cyan-500' : 'bg-neutral-800/80'}`} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* HISTORICAL VAULT */}
        {historyLogs.length > 0 && (
          <div>
             <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2"><History size={14}/> Legacy Telemetry Vault</h3>
             <div className="flex overflow-x-auto gap-2 sm:gap-3 hide-scrollbar pb-4">
                {historyLogs.map((log: any, idx: number) => {
                  const state = generateBlockState(log, true);
                  
                  const currentWater = (log.waterTotal || 0);
                  const isW1 = !!log.workout1?.done;
                  const isW2 = !!log.workout2?.done;
                  const isWater = currentWater >= targetNativeWaterGoal;
                  const isRead = (log.readingTotal || 0) >= readingTarget;
                  const isDiet = !!log.diet;
                  const isPhoto = !!log.photoStorageId;

                  let blockBg = "bg-neutral-900 border-neutral-800 text-neutral-400";
                  if (state === "history_success") blockBg = "bg-emerald-950/20 border-emerald-900/30 text-emerald-600/50";
                  if (state === "failed") blockBg = "bg-red-950/20 border-red-900/30 text-red-600/50";

                  const dateObj = new Date(log.date);
                  const dateLabel = `${dateObj.getMonth()+1}/${dateObj.getDate()}`;

                  return (
                    <button 
                      key={log._id}
                      onClick={() => setSelectedLogDay({ ...log, dayNum: "Legacy" })}
                      className={`flex-shrink-0 w-12 h-14 sm:w-14 sm:h-16 relative rounded-xl border flex flex-col items-center justify-center transition-all ${blockBg} overflow-hidden hover:border-neutral-600`}
                    >
                      <span className="relative z-20 text-[9px] sm:text-[10px] font-black tracking-widest mb-2 opacity-50">{dateLabel}</span>
                      
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-[1px] h-1 opacity-40">
                        <div className={`flex-1 rounded-sm transition-colors ${isW1 ? 'bg-orange-500' : 'bg-neutral-800'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isW2 ? 'bg-violet-500' : 'bg-neutral-800'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isWater ? 'bg-blue-500' : 'bg-neutral-800'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isRead ? 'bg-amber-500' : 'bg-neutral-800'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isDiet ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className={`flex-1 rounded-sm transition-colors ${isPhoto ? 'bg-cyan-500' : 'bg-neutral-800'}`} />
                      </div>
                    </button>
                  );
                })}
             </div>
          </div>
        )}

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
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-sm max-h-[85vh] overflow-y-auto hide-scrollbar"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Day {selectedLogDay?.dayNum}</h2>
                  <p className="text-emerald-500 font-bold text-xs tracking-widest uppercase mt-1">{selectedLogDay?.date}</p>
                </div>
                <button onClick={() => setSelectedLogDay(null)} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5 rotate-[-45deg]" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {/* CRITICAL FIX: Convert target's specific daily log into my unit */}
                  <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <Droplet size={14} className={(selectedLogDay?.waterTotal || 0) > 0 ? "text-blue-500" : "text-neutral-600"} />
                    {canViewWater ? (
                      <>
                        <span className="font-black text-white text-base">
                          {convertWater(selectedLogDay?.waterTotal || 0, targetNativeWaterUnit, myUnit).toFixed(myUnit === "liters" ? 2 : 0)}
                        </span>
                        <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">{myUnit}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-neutral-600 font-bold uppercase mt-1">Hidden</span>
                    )}
                  </div>

                  {/* Reading Block */}
                  <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <BookOpen size={14} className={(selectedLogDay?.readingTotal || 0) > 0 ? "text-amber-500" : "text-neutral-600"} />
                    {canViewReading ? (
                      <>
                        <span className="font-black text-white text-base">{selectedLogDay?.readingTotal || 0}</span>
                        <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Pages</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-neutral-600 font-bold uppercase mt-1">Hidden</span>
                    )}
                  </div>

                  {/* Diet Block */}
                  <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <Utensils size={14} className={selectedLogDay?.diet ? "text-emerald-500" : "text-red-500"} />
                    {canViewDiet ? (
                      <>
                        <span className="font-black text-white text-xs mt-1">{selectedLogDay?.diet ? "CLEAN" : "DIRTY"}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-neutral-600 font-bold uppercase mt-1">Hidden</span>
                    )}
                  </div>
                </div>

                {/* Workout 1 */}
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center"><Flame size={12} className="text-orange-500 mr-2"/> Outdoor</p>
                    {selectedLogDay?.workout1?.done ? <CheckCircle size={14} className="text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-dashed border-neutral-700" />}
                  </div>
                  {canViewWorkouts ? (
                    <>
                      <p className="text-white font-black text-base tracking-tight uppercase">{selectedLogDay?.workout1?.notes || "Standard"}</p>
                      <div className="flex mt-2 items-center gap-2">
                        <span className="bg-orange-500/10 text-orange-500 font-black tracking-widest text-[8px] px-2 py-1 rounded border border-orange-500/20">{selectedLogDay?.workout1?.cals || 0} KCAL</span>
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
                    {selectedLogDay?.workout2?.done ? <CheckCircle size={14} className="text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-dashed border-neutral-700" />}
                  </div>
                  {canViewWorkouts ? (
                    <>
                      <p className="text-white font-black text-base tracking-tight uppercase">{selectedLogDay?.workout2?.notes || "Standard"}</p>
                      <div className="flex mt-2 items-center gap-2">
                        <span className="bg-violet-500/10 text-violet-500 font-black tracking-widest text-[8px] px-2 py-1 rounded border border-violet-500/20">{selectedLogDay?.workout2?.cals || 0} KCAL</span>
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
                    {selectedLogDay?.photoStorageId ? <CheckCircle size={14} className="text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-dashed border-neutral-700" />}
                  </div>
                  
                  {selectedLogDay?.photoStorageId && (
                    canViewPhotos && selectedLogDay?.photoUrl ? (
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