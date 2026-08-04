"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Activity, Map, Book, ShieldAlert } from "lucide-react";
import { ExpeditionDashboard } from "@/components/features/expedition/ExpeditionDashboard";
import { TrailMapView } from "@/components/features/expedition/TrailMapView";
import { StoryFeed } from "@/components/features/expedition/StoryFeed";
import { DecisionModal } from "@/components/features/expedition/DecisionModal";

export default function ExpeditionPage() {
  const expeditionState = useQuery(api.expeditions.getExpeditionState);
  const initializeExpedition = useMutation(api.expeditions.initializeExpedition);
  
  const [activeTab, setActiveTab] = useState<"map" | "story">("map");

  if (expeditionState === undefined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono animate-pulse">
        ESTABLISHING ORBITAL LINK...
      </div>
    );
  }

  if (expeditionState === null) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-red-50">
        <ShieldAlert className="w-16 h-16 text-red-600 mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-widest text-red-500 mb-4">No Active Expedition</h1>
        <p className="text-red-200/60 max-w-md mb-8">
          Your squad has not deployed. Initiate the protocol to begin the Mars Liberation campaign.
        </p>
        <button 
          onClick={() => initializeExpedition()}
          className="bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all active:scale-95"
        >
          Initiate The Expedition
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-red-50 pb-24 font-sans selection:bg-red-900/50">
      <ExpeditionDashboard state={expeditionState} />
      
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex p-1 bg-red-950/30 rounded-2xl border border-red-900/30 mb-6">
          <button 
            onClick={() => setActiveTab("map")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
              activeTab === "map" ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" : "text-red-500/50 hover:text-red-400"
            }`}
          >
            <Map size={16} /> Trail Map
          </button>
          <button 
            onClick={() => setActiveTab("story")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
              activeTab === "story" ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" : "text-red-500/50 hover:text-red-400"
            }`}
          >
            <Book size={16} /> Lore & Feed
          </button>
        </div>

        {activeTab === "map" && <TrailMapView state={expeditionState} />}
        {activeTab === "story" && <StoryFeed state={expeditionState} />}
      </div>

      {expeditionState.status === "decision_pending" && (
        <DecisionModal state={expeditionState} />
      )}
    </div>
  );
}
