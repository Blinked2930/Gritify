import { Target, Activity, Settings } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function ConquestDashboard({ state, onOpenSettings }: { state: any, onOpenSettings: () => void }) {
  const logRun = useMutation(api.conquest.processRunLog);
  const [showLogModal, setShowLogModal] = useState(false);
  
  // Calculate aggregate percentage across all non-pluto houses
  const standardHouses = state.houses.filter((h: any) => h.houseId !== "pluto");
  let totalPct = 0;
  standardHouses.forEach((h: any) => {
    totalPct += h.squadCompletionPercent || 0;
  });
  const percentComplete = standardHouses.length > 0 ? totalPct / standardHouses.length : 0;

  return (
    <div className="pt-[calc(env(safe-area-inset-top)+20px)] px-4">
      <div className="bg-gradient-to-b from-red-950 to-black border border-red-900/50 rounded-[32px] p-6 shadow-[0_0_50px_rgba(220,38,38,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1">Squad Designation</p>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">{state.squadName}</h2>
            </div>
            <button 
              onClick={onOpenSettings}
              className="text-red-500 hover:text-red-400 transition-colors p-2 bg-red-950/50 rounded-full border border-red-900"
            >
              <Settings size={16} />
            </button>
          </div>

          <div className="flex items-end gap-2 mb-2">
            <span className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {percentComplete.toFixed(1)}%
            </span>
            <span className="text-lg font-bold text-red-500/70 mb-2 uppercase tracking-widest">Conquered</span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-red-950 rounded-full overflow-hidden border border-red-900/50 mb-6">
            <div 
              className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <button 
            onClick={() => setShowLogModal(true)}
            className="w-full bg-red-600 hover:bg-red-500 text-white border border-red-400/50 rounded-2xl p-4 backdrop-blur-sm flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          >
            <Activity size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Log Tactical Miles</span>
          </button>
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
                workoutCategory: fd.get("workoutCategory") as string,
                note: fd.get("note") as string,
              });
              setShowLogModal(false);
            }}
          >
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-4">Log Expedition Miles</h3>
            
            <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Distance (Miles)</label>
            <input name="miles" type="number" step="0.1" required className="w-full bg-black border border-red-900 rounded-xl p-4 text-white font-black text-2xl mb-4 focus:border-red-500 outline-none" />

            <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Workout Category (House)</label>
            <select name="workoutCategory" className="w-full bg-black border border-red-900 rounded-xl p-4 text-white font-bold mb-4 focus:border-red-500 outline-none">
              <option value="speed_intervals">Speed / Intervals (Mercury)</option>
              <option value="tempo">Tempo Runs (Minerva)</option>
              <option value="marathon_pace">Marathon Pace (Apollo)</option>
              <option value="long_run_tier_1">Long Runs T1 (Jupiter)</option>
              <option value="long_run_tier_2">Long Runs T2 (Mars)</option>
              <option value="easy_tier_1">Easy Runs T1 (Ceres)</option>
              <option value="easy_tier_2">Easy Runs T2 (Vesta)</option>
              <option value="easy_tier_3">Easy Runs T3 (Vulkan)</option>
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
