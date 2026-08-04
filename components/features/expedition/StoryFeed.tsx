import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Clock } from "lucide-react";

export function StoryFeed({ state }: { state: any }) {
  // In a real app, you'd fetch the runLogs specifically. For now, we simulate the feed.
  // We can just show the narrative nodes that have been cleared as lore drops.

  const clearedNodes = state.nodes.filter((n: any) => n.cleared).sort((a: any, b: any) => b.mileageMarker - a.mileageMarker);

  return (
    <div className="space-y-6">
      {clearedNodes.map((node: any) => (
        <div key={node._id} className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 font-serif">
          <h3 className="text-xl font-bold text-red-500 mb-4">{node.title}</h3>
          <div className="text-neutral-300 leading-relaxed space-y-4 text-sm">
            <p>{node.narrativeText}</p>
            {node.isDecisionNode && (
              <p className="italic text-neutral-500">The squad faced a critical choice and forged their path.</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-between text-[10px] uppercase tracking-widest font-sans font-bold text-neutral-600">
            <span>Milestone Reached</span>
            <span>{node.mileageMarker} Miles</span>
          </div>
        </div>
      ))}
      
      {clearedNodes.length === 0 && (
        <div className="text-center py-12 text-neutral-600 font-serif italic">
          The story has just begun. Log miles to uncover the lore of Lykos.
        </div>
      )}
    </div>
  );
}
