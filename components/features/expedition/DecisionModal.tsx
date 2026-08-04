import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function DecisionModal({ state }: { state: any }) {
  const registerVote = useMutation(api.expeditions.registerVote);
  
  if (!state.activeVote) return null;

  const node = state.nodes.find((n: any) => n._id === state.activeVote.nodeId);
  if (!node || !node.options) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-red-950 border border-red-600 rounded-[32px] w-full max-w-lg p-8 shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center">
        <h2 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2">Tactical Decision</h2>
        <p className="text-sm font-bold text-red-200/70 mb-8 uppercase tracking-widest">{node.title}</p>
        
        <p className="text-red-100 mb-8">
          The squad has reached a critical junction. All members must cast their vote to determine the next phase of the campaign.
        </p>

        <div className="space-y-4">
          {node.options.map((opt: any) => (
            <button 
              key={opt.id}
              onClick={() => registerVote({ optionId: opt.id })}
              className="w-full bg-black border border-red-900/50 hover:border-red-500 hover:bg-red-900/20 p-6 rounded-2xl text-left transition-all group active:scale-95"
            >
              <h4 className="text-lg font-black text-white uppercase tracking-widest group-hover:text-red-400 mb-2">{opt.label}</h4>
              <p className="text-sm text-neutral-400">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
