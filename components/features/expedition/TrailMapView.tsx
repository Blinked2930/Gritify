import { MapPin, Lock, Unlock } from "lucide-react";

export function TrailMapView({ state }: { state: any }) {
  const nodes = [...state.nodes].sort((a, b) => a.mileageMarker - b.mileageMarker);

  return (
    <div className="bg-red-950/20 border border-red-900/30 rounded-3xl p-6">
      <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-8 flex items-center gap-2">
        <MapPin size={16} /> Tactical Map
      </h3>

      <div className="relative pl-6 border-l-2 border-red-900/50 space-y-10">
        {nodes.map((node: any, idx: number) => {
          const isCleared = node.cleared;
          const isCurrent = state.currentNodeId === node._id;
          const isFuture = !isCleared && !isCurrent;

          return (
            <div key={node._id} className="relative">
              {/* Node Marker */}
              <div className={`absolute -left-[35px] w-6 h-6 rounded-full border-4 border-black flex items-center justify-center ${
                isCleared ? "bg-red-600" : isCurrent ? "bg-red-500 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]" : "bg-neutral-800"
              }`}>
                {isCleared ? <Unlock size={10} className="text-black" /> : <Lock size={10} className="text-black" />}
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={`text-lg font-black uppercase tracking-widest ${isFuture ? "text-neutral-500" : "text-red-100"}`}>
                    {node.title}
                  </h4>
                  <span className="text-xs font-bold text-red-500/70">{node.mileageMarker} mi</span>
                </div>
                <p className={`text-sm ${isFuture ? "text-neutral-600" : "text-red-200/70"}`}>
                  {node.narrativeText}
                </p>
                {node.isDecisionNode && !isCleared && (
                  <div className="mt-3 inline-block bg-red-900/40 text-red-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-red-500/30">
                    Tactical Decision Required
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Current Position Marker on the line */}
        <div 
          className="absolute left-[-2px] w-1 bg-red-500 transition-all duration-1000"
          style={{ 
            top: 0, 
            height: `${Math.min(100, (state.currentCollectiveMiles / state.totalTargetMiles) * 100)}%`,
            boxShadow: '0 0 10px rgba(220,38,38,1)'
          }}
        />
      </div>
    </div>
  );
}
