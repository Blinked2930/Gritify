import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const HOUSE_DATA: Record<string, { name: string, godName: string, icon: string, description: string }> = {
  mercury: { name: "House Mercury", godName: "God of Speed", icon: "⚡", description: "Speed / Intervals" },
  minerva: { name: "House Minerva", godName: "Goddess of Wisdom", icon: "🦉", description: "Tempo Runs" },
  apollo: { name: "House Apollo", godName: "God of the Sun", icon: "☀️", description: "Marathon Pace" },
  jupiter: { name: "House Jupiter", godName: "King of Gods", icon: "🦅", description: "Long Runs (Tier 1)" },
  mars: { name: "House Mars", godName: "God of War", icon: "⚔️", description: "Long Runs (Peak)" },
  ceres: { name: "House Ceres", godName: "Goddess of Agriculture", icon: "🌾", description: "Easy Runs (Tier 1)" },
  vesta: { name: "House Vesta", godName: "Goddess of Hearth", icon: "🔥", description: "Easy Runs (Tier 2)" },
  vulkan: { name: "House Vulkan", godName: "God of Fire", icon: "🌋", description: "Easy Runs (Tier 3)" },
  pluto: { name: "The Citadel", godName: "House Pluto", icon: "💀", description: "Final Marathon" },
};

export function HouseConquestGrid({ state }: { state: any }) {
  // We expect 9 houses
  const houses = state.houses || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
      {houses.map((house: any) => {
        const meta = HOUSE_DATA[house.houseId] || { name: house.houseId, godName: "Unknown", icon: "❓", description: "" };
        const isPluto = house.houseId === "pluto";
        
        // If it's pluto, check if unlocked
        const isLocked = isPluto && !state.plutoUnlocked;

        return (
          <div key={house.houseId} className={`relative bg-neutral-950 border ${house.squadConquered ? 'border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'border-neutral-900'} rounded-3xl p-6 overflow-hidden ${isLocked ? 'opacity-50 grayscale' : ''}`}>
            
            {isLocked && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 backdrop-blur-sm">
                <span className="text-4xl">🔒</span>
              </div>
            )}

            {house.squadConquered && (
              <div className="absolute top-0 right-0 bg-red-600 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-bl-xl z-10">
                Conquered
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/70">{meta.godName}</p>
                <h3 className="text-xl font-black uppercase tracking-widest text-white">{meta.name}</h3>
                <p className="text-xs text-neutral-500 mt-1">{meta.description}</p>
              </div>
              <div className="text-3xl opacity-80">{meta.icon}</div>
            </div>

            {/* Squad Progress Circular or Text */}
            <div className="mb-6 flex items-baseline gap-1">
              <span className={`text-4xl font-black ${house.squadConquered ? 'text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'text-neutral-400'}`}>
                {isPluto ? (house.squadConquered ? "100" : "0") : (house.squadCompletionPercent || 0).toFixed(0)}%
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest">Squad Avg</span>
            </div>

            {/* Member Mini Bars */}
            {!isPluto && (
              <div className="space-y-3 border-t border-neutral-900 pt-4">
                {house.memberProgress.map((mp: any) => (
                  <div key={mp.userId}>
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-neutral-400 uppercase font-bold tracking-widest truncate max-w-[80px]">
                        {mp.user?.name || "Member"}
                      </span>
                      <span className={mp.completed ? 'text-red-400' : 'text-neutral-500'}>
                        {mp.currentMiles.toFixed(1)} / {mp.targetMiles.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${mp.completed ? 'bg-red-500 shadow-[0_0_5px_rgba(220,38,38,0.8)]' : 'bg-neutral-600'}`}
                        style={{ width: `${mp.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
