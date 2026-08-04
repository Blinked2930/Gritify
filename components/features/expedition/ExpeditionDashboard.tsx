import { Target, Flame, Activity } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function ExpeditionDashboard({ state }: { state: any }) {
  const logRun = useMutation(api.expeditions.processRunLog);
  const [showLogModal, setShowLogModal] = useState(false);
  const percentComplete = Math.min(100, (state.currentCollectiveMiles / state.totalTargetMiles) * 100);

  const currentNode = state.nodes.find((n: any) => n._id === state.currentNodeId) || state.nodes[0];

  return (
    <div className="pt-[calc(env(safe-area-inset-top)+20px)] px-4">
      <div className="bg-gradient-to-b from-red-950 to-black border border-red-900/50 rounded-[32px] p-6 shadow-[0_0_50px_rgba(220,38,38,0.15)] relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1">Squad Designation</p>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">{state.groupName}</h2>
            </div>
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]">
              {state.status === "decision_pending" ? "Awaiting Orders" : "Active Deployment"}
            </div>
          </div>

          <div className="flex items-end gap-2 mb-2">
            <span className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {state.currentCollectiveMiles.toFixed(1)}
            </span>
            <span className="text-lg font-bold text-red-500/70 mb-2 uppercase tracking-widest">/ {state.totalTargetMiles} MI</span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-red-950 rounded-full overflow-hidden border border-red-900/50 mb-6">
            <div 
              className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/50 border border-red-900/30 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/70 mb-1 flex items-center gap-1">
                <Target size={12} /> Current Objective
              </p>
              <p className="font-bold text-sm text-red-100">{currentNode?.title || "Unknown Territory"}</p>
            </div>
            <button 
              onClick={() => setShowLogModal(true)}
              className="bg-red-600 hover:bg-red-500 text-white border border-red-400/50 rounded-2xl p-4 backdrop-blur-sm flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
              <Activity size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Log Miles</span>
            </button>
          </div>
        </div>
      </div>

      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form 
            className="bg-red-950 border border-red-900 p-6 rounded-[32px] w-full max-w-md"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await logRun({
                miles: Number(fd.get("miles")),
                workoutType: fd.get("workoutType") as any,
                note: fd.get("note") as string,
              });
              setShowLogModal(false);
            }}
          >
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-4">Log Expedition Miles</h3>
            
            <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Distance (Miles)</label>
            <input name="miles" type="number" step="0.1" required className="w-full bg-black border border-red-900 rounded-xl p-4 text-white font-black text-2xl mb-4 focus:border-red-500 outline-none" />

            <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Workout Type</label>
            <select name="workoutType" className="w-full bg-black border border-red-900 rounded-xl p-4 text-white font-bold mb-4 focus:border-red-500 outline-none">
              <option value="easy">Easy / Recon</option>
              <option value="tempo">Tempo / Attack</option>
              <option value="marathon_pace">Marathon Pace / Steady March</option>
              <option value="long_run">Long Run / Great Trek</option>
            </select>

            <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Debrief Notes (Optional)</label>
            <textarea name="note" className="w-full bg-black border border-red-900 rounded-xl p-4 text-white text-sm mb-6 focus:border-red-500 outline-none h-24" />

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowLogModal(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-xs text-red-500 hover:bg-red-900/30 rounded-xl transition-all">Cancel</button>
              <button type="submit" className="flex-1 py-4 font-black uppercase tracking-widest text-xs bg-red-600 text-white rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:bg-red-500 transition-all">Transmit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
