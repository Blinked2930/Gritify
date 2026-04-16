"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CircularProgress } from "@/components/features/CircularProgress";
import { ArrowLeft, Dumbbell, ShieldCheck, ShieldAlert, Loader2, Check, X } from "lucide-react";
import Link from "next/link";

export default function PartnerDashboard() {
  const partnerData = useQuery(api.logs.getPartnerData);
  const resolveVouch = useMutation(api.logs.resolveVouch);

  const WATER_GOAL = 128;
  const READING_GOAL = 10;

  if (partnerData === undefined) {
    return (
      <div className="min-h-screen bg-grit-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-grit-purple animate-spin" />
      </div>
    );
  }

  if (!partnerData || !partnerData.partner) {
    return (
      <div className="min-h-screen bg-grit-obsidian text-white flex flex-col items-center justify-center p-6">
        <ShieldCheck className="w-16 h-16 text-grit-purple mb-6 opacity-50" />
        <h1 className="text-2xl font-black mb-4 tracking-tight">Awaiting Link...</h1>
        <p className="text-white/50 text-center mb-8 max-w-xs">
          Once your partner creates their account, their live stats will sync directly to this matrix.
        </p>
        <Link href="/" className="bg-white/10 px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-white/20 transition-colors">
          Return to Grind
        </Link>
      </div>
    );
  }

  const { partner, log } = partnerData;
  const waterCount = log?.waterTotal || 0;
  const pagesRead = log?.readingTotal || 0;
  const workout1Done = log?.workout1?.done || false;
  const workout2Done = log?.workout2?.done || false;
  const workoutsCompleted = (workout1Done ? 1 : 0) + (workout2Done ? 1 : 0);
  
  // Vouch Logic States
  const isVouchPending = log?.status === "vouch_pending";
  const isVouched = log?.status === "vouched";
  const isFailed = log?.status === "failed";

  return (
    <main className="min-h-screen bg-grit-obsidian text-white p-6 pb-24 font-sans">
      
      <header className="mb-10 pt-6 flex items-start gap-4">
        <Link href="/" className="mt-1 bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-grit-purple font-black text-sm uppercase tracking-widest">
              Live Feed
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter capitalize">{partner.name}'s Grind.</h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-5 mb-8 opacity-90">
        <div className="col-span-1 bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center">
          <CircularProgress value={waterCount} max={WATER_GOAL} label="Ounces" colorClass="text-grit-cyan" size={130} />
          <div className="mt-6 font-black tracking-widest text-white/50 uppercase text-xs">Hydration</div>
        </div>

        <div className="col-span-1 bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center">
          <CircularProgress value={pagesRead} max={READING_GOAL} label="Pages" colorClass="text-grit-purple" size={130} />
          <div className="mt-6 font-black tracking-widest text-white/50 uppercase text-xs">Mindset</div>
        </div>

        <div className="col-span-2 bg-white/5 border border-white/10 p-6 rounded-[3rem]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight">The Grind</h3>
              <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Physical Targets</p>
            </div>
            <Dumbbell className={workoutsCompleted === 2 ? "text-grit-purple" : "text-white/20"} />
          </div>
          <div className="flex gap-3">
            <div className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center transition-all ${workout1Done ? 'bg-grit-purple text-white shadow-[0_0_15px_rgba(181,51,255,0.3)]' : 'bg-white/5 text-white/30 border border-white/10'}`}>
              Session 1 {workout1Done && '✓'}
            </div>
            <div className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center transition-all ${workout2Done ? 'bg-grit-purple text-white shadow-[0_0_15px_rgba(181,51,255,0.3)]' : 'bg-white/5 text-white/30 border border-white/10'}`}>
              Session 2 {workout2Done && '✓'}
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Wall Interactive Section */}
      <section className={`border p-6 rounded-[2.5rem] transition-all ${isVouchPending ? 'bg-grit-orange/10 border-grit-orange/50 shadow-[0_0_30px_rgba(255,94,0,0.1)]' : 'bg-white/5 border-white/10'}`}>
        <div className="flex items-center gap-3 mb-2">
          {isVouchPending ? <ShieldAlert className="w-5 h-5 text-grit-orange animate-pulse" /> : <ShieldCheck className="w-5 h-5 text-grit-purple" />}
          <h3 className="font-black uppercase tracking-widest text-sm">Difficulty Wall</h3>
        </div>
        
        {isVouchPending ? (
          <div>
            <p className="text-white/80 text-xs mb-6 leading-relaxed">
              {partner.name} is requesting a backfill vouch for today's grind. By approving, you agree they maintained the spirit of the challenge.
            </p>
            <div className="flex gap-3">
              <button onClick={() => resolveVouch({ logId: log._id, approved: true })} className="flex-1 bg-grit-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                <Check size={16} /> Approve
              </button>
              <button onClick={() => resolveVouch({ logId: log._id, approved: false })} className="flex-1 bg-white/5 border border-white/10 text-white/70 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all">
                <X size={16} /> Deny
              </button>
            </div>
          </div>
        ) : isVouched ? (
          <p className="text-grit-purple font-bold text-xs">You vouched for {partner.name} today.</p>
        ) : isFailed ? (
          <p className="text-red-500 font-bold text-xs">You denied {partner.name}'s vouch request.</p>
        ) : (
          <p className="text-white/40 text-xs">No backfill requests pending. Stay disciplined.</p>
        )}
      </section>

    </main>
  );
}