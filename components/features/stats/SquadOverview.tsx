import { ArrowLeft, Flame, Droplet, BookOpen, Activity, Utensils, Camera, User } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { calculateDay } from "@/lib/statsUtils";

export default function SquadOverview({ fullSquadList, openUserDetail }: { fullSquadList: any[], openUserDetail: (u: any) => void }) {
  const getTodayLogForUser = (logs: any[]) => {
    const now = new Date();
    now.setHours(now.getHours() - 2);
    const todayStr = now.toISOString().split("T")[0];
    return logs.find(l => l.date === todayStr);
  };

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
            
            const waterTarget = u?.vesselUnit === "liters" ? 3.78 : u?.vesselUnit === "ml" ? 3785 : 128;
            const currentWater = todayLog ? (todayLog?.waterTotal || 0) : 0;
            const currentDay = calculateDay(u?.challengeStartDate);
            
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
                onClick={() => openUserDetail(member)}
                className={`w-full bg-neutral-900/60 backdrop-blur-md border rounded-3xl p-5 text-left relative overflow-hidden group transition-all flex flex-col gap-4 ${member.isMe ? 'border-emerald-500/30' : 'border-neutral-800'}`}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black uppercase text-white tracking-widest flex items-center gap-2">
                      {member.isMe ? <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> : <User size={14} className="text-neutral-500" />}
                      {member.user.name}
                    </h2>
                    <span className="bg-neutral-800 text-neutral-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-neutral-700">Day {currentDay}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold group-hover:text-emerald-400 transition-colors">Deep Dive &rarr;</span>
                </div>

                <div className="flex items-center justify-between w-full bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/80">
                  <div className="flex flex-col items-center gap-1.5 group/item"><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isW1 ? 'bg-orange-500/20 text-orange-500' : 'bg-neutral-800 text-neutral-400'}`}><Flame size={14} /></div></div>
                  <div className="flex flex-col items-center gap-1.5 group/item"><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isW2 ? 'bg-violet-500/20 text-violet-500' : 'bg-neutral-800 text-neutral-400'}`}><Activity size={14} /></div></div>
                  <div className="flex flex-col items-center gap-1.5 group/item"><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isWater ? 'bg-blue-500/20 text-blue-500' : 'bg-neutral-800 text-neutral-400'}`}><Droplet size={14} /></div></div>
                  <div className="flex flex-col items-center gap-1.5 group/item"><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isRead ? 'bg-amber-500/20 text-amber-500' : 'bg-neutral-800 text-neutral-400'}`}><BookOpen size={14} /></div></div>
                  <div className="flex flex-col items-center gap-1.5 group/item"><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDiet ? 'bg-emerald-500/20 text-emerald-500' : 'bg-neutral-800 text-neutral-400'}`}><Utensils size={14} /></div></div>
                  <div className="flex flex-col items-center gap-1.5 group/item"><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPhoto ? 'bg-cyan-500/20 text-cyan-500' : 'bg-neutral-800 text-neutral-400'}`}><Camera size={14} /></div></div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}