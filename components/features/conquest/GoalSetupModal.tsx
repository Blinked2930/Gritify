import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X } from "lucide-react";
import { useState } from "react";

const STANDARD_HOUSES = [
  { id: "mercury", label: "Speed / Intervals (Mercury)" },
  { id: "minerva", label: "Tempo Runs (Minerva)" },
  { id: "apollo", label: "Marathon Pace (Apollo)" },
  { id: "jupiter", label: "Long Runs Tier 1 (Jupiter)" },
  { id: "mars", label: "Long Runs Peak (Mars)" },
  { id: "ceres", label: "Easy Runs Tier 1 (Ceres)" },
  { id: "vesta", label: "Easy Runs Tier 2 (Vesta)" },
  { id: "vulkan", label: "Easy Runs Tier 3 (Vulkan)" },
];

export function GoalSetupModal({ state, onClose }: { state: any, onClose: () => void }) {
  const setMemberGoals = useMutation(api.conquest.setMemberGoals);
  
  // Try to find existing targets for this user to pre-fill the form
  // We grab the first user's memberProgress entry that matches our active clerk/convex user.
  // We don't have the user's ID directly in props, but we can extract it from one of the houses.
  const sampleHouse = state.houses[0];
  const myProgress = sampleHouse?.memberProgress.find((mp: any) => mp.user); // Hacky way if user is populated

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-red-950 border border-red-600 rounded-[32px] w-full max-w-md p-6 shadow-[0_0_50px_rgba(220,38,38,0.3)] my-auto relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-red-500 hover:text-white">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2 mt-4">Personal Target Sync</h2>
        <p className="text-sm font-bold text-red-200/70 mb-6 uppercase tracking-widest">
          Set your total mileage target for each workout category. The squad relies on you hitting 100% of these numbers.
        </p>

        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            const fd = new FormData(e.currentTarget);
            const goals = STANDARD_HOUSES.map(h => ({
              houseId: h.id,
              targetMiles: Number(fd.get(h.id)) || 0
            }));
            
            await setMemberGoals({ goals });
            setIsSubmitting(false);
            onClose();
          }}
          className="space-y-4"
        >
          {STANDARD_HOUSES.map(h => {
            // Find existing target
            const houseData = state.houses.find((hx: any) => hx.houseId === h.id);
            // Since we need to know WHICH progress is ours, and we don't pass userId down, 
            // the safest bet is if the form is just 0 by default, or we can look for the user object.
            // Let's just leave it empty if we can't find it reliably, or use 0.
            let defaultVal = 0;
            if (houseData) {
              const p = houseData.memberProgress.find((mp: any) => mp.user !== undefined); // assumes the query populated it for us
              if (p) defaultVal = p.targetMiles;
            }

            return (
              <div key={h.id} className="flex justify-between items-center bg-black/50 p-3 rounded-xl border border-red-900/50">
                <label className="text-xs font-bold text-red-100 uppercase tracking-widest">{h.label}</label>
                <input 
                  name={h.id}
                  type="number" 
                  step="0.1" 
                  defaultValue={defaultVal}
                  className="w-24 bg-black border border-red-900 rounded-lg p-2 text-white font-black text-center focus:border-red-500 outline-none" 
                />
              </div>
            );
          })}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-6 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Syncing..." : "Lock Targets"}
          </button>
        </form>
      </div>
    </div>
  );
}
