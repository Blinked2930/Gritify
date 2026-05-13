import { ArrowLeft, Flame, Droplet, BookOpen, Activity, Utensils, ShieldAlert, CheckCircle, Camera, X, History, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { calculateDay, convertWater } from "@/lib/statsUtils";

export default function UserDeepDive({ 
  selectedUserDetailed, 
  myUnit, 
  meId,
  closeDeepDive 
}: { 
  selectedUserDetailed: any, 
  myUnit: string, 
  meId: string,
  closeDeepDive: () => void 
}) {
  const [selectedLogDay, setSelectedLogDay] = useState<any | null>(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  
  const targetUser = selectedUserDetailed.user;
  const targetStats = selectedUserDetailed.stats;
  const allTargetLogs = selectedUserDetailed.logs || [];
  const isMe = selectedUserDetailed.isMe;

  const currentDay = calculateDay(targetUser.challengeStartDate);
  const boundedDay = Math.max(1, Math.min(currentDay, 75));
  const [calendarPage, setCalendarPage] = useState(Math.floor((boundedDay - 1) / 28));

  useEffect(() => {
    const handlePopState = () => {
      if (expandedPhotoUrl) setExpandedPhotoUrl(null);
      else if (selectedLogDay) setSelectedLogDay(null);
      else closeDeepDive();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [expandedPhotoUrl, selectedLogDay, closeDeepDive]);

  const openLogDay = (logData: any) => {
    window.history.pushState({ view: 'log_day' }, "");
    setSelectedLogDay(logData);
  };

  const openPhotoUrl = (url: string) => {
    window.history.pushState({ view: 'photo' }, "");
    setExpandedPhotoUrl(url);
  };

  const handleCloseModal = () => {
    window.history.back(); 
  };

  const challengeStart = targetUser.challengeStartDate ? new Date(targetUser.challengeStartDate) : new Date(0);
  challengeStart.setHours(12,0,0,0);

  const currentLogs = allTargetLogs.filter((l: any) => new Date(l.date) >= challengeStart);
  const historyLogs = allTargetLogs.filter((l: any) => new Date(l.date) < challengeStart).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const checkAccess = (setting: any) => {
    if (isMe) return true;
    if (setting === true || setting === "everyone" || setting === undefined) return true;
    if (setting === "close_friends") return targetUser.privacySettings?.closeFriends?.includes(meId) || false;
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
    const isW1 = !!log.workout1?.done;
    const isW2 = !!log.workout2?.done;
    const isWater = (log.waterTotal || 0) >= targetNativeWaterGoal;
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
    const blockDate = new Date(challengeStart);
    blockDate.setDate(blockDate.getDate() + i);
    const dateString = blockDate.toISOString().split("T")[0];
    const dateLabel = `${blockDate.getMonth() + 1}/${blockDate.getDate()}`;
    const exactLog = currentLogs.find((l: any) => l.date === dateString);
    return { dayNum, state: generateBlockState(exactLog), log: exactLog, dateLabel };
  });

  const totalPages = Math.ceil(75 / 28);
  const visibleBlocks = calendarBlocks.slice(calendarPage * 28, (calendarPage + 1) * 28);
  const startDayIndex = Math.max(0, currentDay - 5);
  const recent5Blocks = calendarBlocks.slice(startDayIndex, startDayIndex + 5);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] sm:px-6 sm:pb-6 sm:pt-[calc(env(safe-area-inset-top)+24px)] font-sans overflow-x-hidden pb-32 relative">
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center gap-4 border-b border-neutral-800/50 pb-6 pt-4">
          <button onClick={handleCloseModal} className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 p-3 rounded-full hover:bg-emerald-500/10 transition-all group">
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
              {canViewWorkouts ? <p className="text-2xl font-black text-white">{targetStats?.totalCals?.toLocaleString() || 0}</p> : <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>}
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
              <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Activity size={12} className="text-violet-500" /> Workouts</p>
              {canViewWorkouts ? <p className="text-2xl font-black text-white">{targetStats?.workoutCount || 0}</p> : <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>}
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
              <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><Droplet size={12} className="text-blue-500" /> Water ({myUnit})</p>
              {canViewWater ? <p className="text-2xl font-black text-white">{convertWater(targetStats?.totalWater || 0, targetNativeWaterUnit, myUnit).toLocaleString(undefined, {maximumFractionDigits: 1})}</p> : <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>}
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl">
              <p className="flex items-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest mb-1 gap-1"><BookOpen size={12} className="text-amber-500" /> Pages</p>
              {canViewReading ? <p className="text-2xl font-black text-white">{targetStats?.totalPages?.toLocaleString() || 0}</p> : <p className="text-xs font-bold text-neutral-600 uppercase flex items-center gap-1 mt-2"><ShieldAlert size={14} /> Hidden</p>}
            </div>
          </div>
        </div>

        {/* Dynamic Grid Views */}
        {!showFullCalendar ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14}/> Recent Telemetry</h3>
              <button onClick={() => setShowFullCalendar(true)} className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-500 transition-colors">
                <Maximize2 size={12} /> Expand 75-Day Grid
              </button>
            </div>
            <div className="bg-neutral-900/20 p-4 sm:p-5 rounded-3xl border border-neutral-800/30 backdrop-blur-xl">
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {recent5Blocks.map((block) => {
                  const log = block.log;
                  const isW1 = log?.workout1?.done;
                  const isW2 = log?.workout2?.done;
                  const isWater = (log?.waterTotal || 0) >= targetNativeWaterGoal;
                  const isRead = log && (log.readingTotal || 0) >= readingTarget;
                  const isDiet = log?.diet;
                  const isPhoto = log?.photoStorageId;

                  let blockBg = "bg-neutral-900/50 border-neutral-800 text-neutral-600";
                  if (block.state === "success") blockBg = "bg-gradient-to-b from-emerald-500/20 to-emerald-900/40 border-emerald-500/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]"; 
                  else if (block.state === "pending") blockBg = "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"; 
                  else if (block.state === "failed") blockBg = "bg-red-950/30 border-red-900/50 text-red-500";

                  return (
                    <button key={block.dayNum} disabled={block.state === "future"} onClick={() => block.log && openLogDay({ ...block.log, dayNum: block.dayNum, explicitDate: block.dateLabel })} className={`relative w-full aspect-square sm:aspect-[4/5] rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 font-extrabold tracking-tighter ${blockBg} overflow-hidden`}>
                      <div className="relative z-20 flex flex-col items-center justify-center -mt-1 sm:mt-0 mb-1 sm:mb-2 gap-0 sm:gap-1">
                        <span className="text-sm sm:text-2xl leading-none">{block.dayNum}</span>
                        <span className="text-[9px] sm:text-xs text-neutral-400 font-bold tracking-tighter opacity-80 leading-none mt-[1px]">{block.dateLabel}</span>
                      </div>
                      {block.state !== "future" && (
                        <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex gap-[1px] h-1 sm:h-2">
                          <div className={`flex-1 rounded-sm transition-colors ${isW1 ? 'bg-orange-500' : 'bg-neutral-800/80'}`} />
                          <div className={`flex-1 rounded-sm transition-colors ${isW2 ? 'bg-violet-500' : 'bg-neutral-800/80'}`} />
                          <div className={`flex-1 rounded-sm transition-colors ${isWater ? 'bg-blue-500' : 'bg-neutral-800/80'}`} />
                          <div className={`flex-1 rounded-sm transition-colors ${isRead ? 'bg-amber-500' : 'bg-neutral-800/80'}`} />
                          <div className={`flex-1 rounded-sm transition-colors ${isDiet ? 'bg-emerald-500' : 'bg-neutral-800/80'}`} />
                          <div className={`flex-1 rounded-sm transition-colors ${isPhoto ? 'bg-cyan-500' : 'bg-neutral-800/80'}`} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
             <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14}/> Full 75-Day Protocol</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowFullCalendar(false)} className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-full hover:bg-neutral-800 transition-colors text-neutral-400 mr-2"><Minimize2 size={14} /></button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCalendarPage(p => Math.max(0, p - 1))} disabled={calendarPage === 0} className="p-1 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest w-16 text-center">{calendarPage * 28 + 1} - {Math.min((calendarPage + 1) * 28, 75)}</span>
                  <button onClick={() => setCalendarPage(p => Math.min(totalPages - 1, p + 1))} disabled={calendarPage === totalPages - 1} className="p-1 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
            <div className="bg-neutral-900/20 p-4 sm:p-5 rounded-3xl border border-neutral-800/30 backdrop-blur-xl">
              <AnimatePresence mode="wait">
                <motion.div key={calendarPage} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="grid grid-cols-7 gap-1 sm:gap-3">
                  {visibleBlocks.map((block) => {
                    const log = block.log;
                    const isW1 = log?.workout1?.done;
                    const isW2 = log?.workout2?.done;
                    const isWater = (log?.waterTotal || 0) >= targetNativeWaterGoal;
                    const isRead = log && (log.readingTotal || 0) >= readingTarget;
                    const isDiet = log?.diet;
                    const isPhoto = log?.photoStorageId;

                    let blockBg = "bg-neutral-900/50 border-neutral-800 text-neutral-600";
                    if (block.state === "success") blockBg = "bg-gradient-to-b from-emerald-500/20 to-emerald-900/40 border-emerald-500/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]"; 
                    else if (block.state === "pending") blockBg = "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"; 
                    else if (block.state === "failed") blockBg = "bg-red-950/30 border-red-900/50 text-red-500";

                    return (
                      <button key={block.dayNum} disabled={block.state === "future"} onClick={() => block.log && openLogDay({ ...block.log, dayNum: block.dayNum, explicitDate: block.dateLabel })} className={`relative w-full aspect-square rounded-lg sm:rounded-xl border flex flex-col items-center justify-center transition-all duration-300 font-extrabold tracking-tighter ${blockBg} overflow-hidden`}>
                        <div className="relative z-20 flex flex-col items-center justify-center -mt-1 sm:mt-0 mb-1 sm:mb-2 gap-0 sm:gap-0.5">
                          <span className="text-[10px] sm:text-sm leading-none">{block.dayNum}</span>
                          <span className="text-[7px] sm:text-[9px] text-neutral-400 font-bold tracking-tighter opacity-80 leading-none mt-[1px]">{block.dateLabel}</span>
                        </div>
                        {block.state !== "future" && (
                          <div className="absolute bottom-1 sm:bottom-1.5 left-1 sm:left-1.5 right-1 sm:right-1.5 flex gap-[1px] h-[3px] sm:h-1.5">
                            <div className={`flex-1 rounded-sm transition-colors ${isW1 ? 'bg-orange-500' : 'bg-neutral-800/80'}`} />
                            <div className={`flex-1 rounded-sm transition-colors ${isW2 ? 'bg-violet-500' : 'bg-neutral-800/80'}`} />
                            <div className={`flex-1 rounded-sm transition-colors ${isWater ? 'bg-blue-500' : 'bg-neutral-800/80'}`} />
                            <div className={`flex-1 rounded-sm transition-colors ${isRead ? 'bg-amber-500' : 'bg-neutral-800/80'}`} />
                            <div className={`flex-1 rounded-sm transition-colors ${isDiet ? 'bg-emerald-500' : 'bg-neutral-800/80'}`} />
                            <div className={`flex-1 rounded-sm transition-colors ${isPhoto ? 'bg-cyan-500' : 'bg-neutral-800/80'}`} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </div>

      {/* Individual Day Modal */}
      <AnimatePresence>
        {selectedLogDay && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleCloseModal} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-sm max-h-[85vh] overflow-y-auto hide-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Day {selectedLogDay?.dayNum}</h2>
                  <p className="text-emerald-500 font-bold text-xs tracking-widest uppercase mt-1">{selectedLogDay?.explicitDate || selectedLogDay?.date}</p>
                </div>
                <button onClick={handleCloseModal} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5 rotate-[-45deg]" /></button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <Droplet size={14} className={(selectedLogDay?.waterTotal || 0) >= targetNativeWaterGoal ? "text-blue-500" : "text-neutral-600"} />
                    {canViewWater ? (
                      <>
                        <span className="font-black text-white text-base">{convertWater(selectedLogDay?.waterTotal || 0, targetNativeWaterUnit, myUnit).toFixed(myUnit === "liters" ? 2 : 0)}</span>
                        <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">{myUnit}</span>
                      </>
                    ) : <span className="text-[10px] text-neutral-600 font-bold uppercase mt-1">Hidden</span>}
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <BookOpen size={14} className={(selectedLogDay?.readingTotal || 0) >= readingTarget ? "text-amber-500" : "text-neutral-600"} />
                    {canViewReading ? (
                      <>
                        <span className="font-black text-white text-base">{selectedLogDay?.readingTotal || 0}</span>
                        <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Pages</span>
                      </>
                    ) : <span className="text-[10px] text-neutral-600 font-bold uppercase mt-1">Hidden</span>}
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                    <Utensils size={14} className={selectedLogDay?.diet ? "text-emerald-500" : "text-neutral-600"} />
                    {canViewDiet ? (
                      <span className={`font-black text-xs mt-1 ${selectedLogDay?.diet ? "text-emerald-500" : "text-neutral-600"}`}>{selectedLogDay?.diet ? "CLEAN" : "DIRTY"}</span>
                    ) : <span className="text-[10px] text-neutral-600 font-bold uppercase mt-1">Hidden</span>}
                  </div>
                </div>

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
                  ) : <p className="text-neutral-600 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-1"><ShieldAlert size={10}/> Details Hidden</p>}
                </div>

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
                  ) : <p className="text-neutral-600 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-1"><ShieldAlert size={10}/> Details Hidden</p>}
                </div>

                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center"><Camera size={12} className="text-emerald-500 mr-2"/> Progress Photo</p>
                    {selectedLogDay?.photoStorageId ? <CheckCircle size={14} className="text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-dashed border-neutral-700" />}
                  </div>
                  {selectedLogDay?.photoStorageId && (
                    canViewPhotos && selectedLogDay?.photoUrl ? (
                      <div onClick={() => openPhotoUrl(selectedLogDay.photoUrl)} className="mt-3 relative w-full h-48 rounded-lg overflow-hidden border border-neutral-800 cursor-pointer group/img">
                        <img src={selectedLogDay.photoUrl} alt="Progress" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover/img:opacity-100 text-white font-bold text-xs tracking-widest uppercase bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm transition-opacity">Expand</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-center h-24 border border-dashed border-neutral-800 rounded-lg gap-2 text-neutral-600">
                        <ShieldAlert size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Image Hidden</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedPhotoUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={handleCloseModal} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 p-3 bg-neutral-800/80 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors z-20 backdrop-blur-md">
                <X size={24} />
              </button>
              <img src={expandedPhotoUrl} alt="Full Screen Progress" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}