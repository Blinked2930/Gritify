"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShieldAlert } from "lucide-react";
import { ConquestDashboard } from "@/components/features/conquest/ConquestDashboard";
import { HouseConquestGrid } from "@/components/features/conquest/HouseConquestGrid";
import { GoalSetupModal } from "@/components/features/conquest/GoalSetupModal";
import { useState } from "react";

export default function ConquestPage() {
  const campaignState = useQuery(api.conquest.getCampaignState);
  const initializeCampaign = useMutation(api.conquest.initializeCampaign);
  
  const [showGoalSetup, setShowGoalSetup] = useState(false);

  if (campaignState === undefined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono animate-pulse">
        ESTABLISHING ORBITAL LINK...
      </div>
    );
  }

  if (campaignState === null) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-red-50">
        <ShieldAlert className="w-16 h-16 text-red-600 mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-widest text-red-500 mb-4">No Active Campaign</h1>
        <p className="text-red-200/60 max-w-md mb-8">
          Your squad has not deployed. Initiate the Conquest protocol to begin the Mars Liberation campaign.
        </p>
        <button 
          onClick={() => initializeCampaign()}
          className="bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all active:scale-95"
        >
          Initiate The Conquest
        </button>
      </div>
    );
  }

  // Check if current user needs to set goals (e.g. if any standard house target is 0)
  // We will assume they need to set goals if targetMiles === 0 for the first house.
  // The GoalSetupModal allows overriding this later.
  
  return (
    <div className="min-h-screen bg-black text-red-50 pb-24 font-sans selection:bg-red-900/50">
      <ConquestDashboard state={campaignState} onOpenSettings={() => setShowGoalSetup(true)} />
      
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <HouseConquestGrid state={campaignState} />
      </div>

      {showGoalSetup && (
        <GoalSetupModal state={campaignState} onClose={() => setShowGoalSetup(false)} />
      )}
    </div>
  );
}
