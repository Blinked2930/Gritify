"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, CheckCircle, Droplet, BookOpen, Camera, ShieldAlert, ShieldCheck, Check, X, Loader2, Link as LinkIcon, Edit2 } from "lucide-react";
import Link from "next/link";

export default function PartnerDashboard() {
  const partnerData = useQuery(api.logs.getPartnerData);
  const resolveVouch = useMutation(api.logs.resolveVouch);
  const addReaction = useMutation(api.logs.addReaction);
  
  const allPartners = useQuery(api.logs.getAvailablePartners);
  const linkPartnerId = useMutation(api.logs.linkPartnerId);
  const renameUserForced = useMutation(api.logs.renameUserForced);
  const [isLinking, setIsLinking] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState("");

  if (partnerData === undefined) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!partnerData || !partnerData.partner) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <ShieldCheck className="w-16 h-16 text-emerald-500 mb-6 opacity-50" />
        <h1 className="text-2xl font-black mb-4 tracking-tight uppercase">Awaiting Link...</h1>
        <p className="text-white/50 text-center mb-8 max-w-xs font-mono text-sm">
          Once your partner creates their account, their live stats will sync directly to this matrix.
        </p>
        <Link href="/" className="bg-white/10 px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-white/20 transition-colors text-sm">
          Return to Grind
        </Link>
      </div>
    );
  }

  const { partner, log } = partnerData;
  const firstName = partner.name.split(" ")[0];

  let currentDay = 1;
  const now = new Date();
  now.setHours(now.getHours() - 2);
  if (partner.challengeStartDate) {
    const start = new Date(partner.challengeStartDate);
    start.setHours(start.getHours() - 2);
    start.setHours(0,0,0,0);
    const todayStr = new Date(now);
    todayStr.setHours(0,0,0,0);
    const diffTime = Math.abs(todayStr.getTime() - start.getTime());
    currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  const currentWaterAmountStr = log ? (log.waterTotal * partner.vesselSize) : 0;
  const isWaterMet = currentWaterAmountStr >= 128;
  const isPagesMet = log ? log.readingTotal >= partner.dailyReadingGoal : false;
  
  const isW1Met = log?.workout1?.done;
  const isW2Met = log?.workout2?.done;
  const isDisciplineMet = log?.diet && log?.photoStorageId;

  // Vouch Logic States
  const isVouchPending = log?.status === "vouch_pending";
  const isVouched = log?.status === "vouched";
  const isFailed = log?.status === "failed";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-4 sm:p-6 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-32">
        
        {/* Header Section */}
        <div className="flex items-end justify-between border-b border-neutral-800 pb-6 pt-4">
          <div className="flex items-start gap-4">
            <Link href="/" className="mt-1 bg-white/5 p-3 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                {isRenaming ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 text-white font-black text-3xl sm:text-4xl uppercase px-2 py-1 rounded outline-none w-48 sm:w-64"
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && tempName.trim()) {
                          await renameUserForced({ userId: partner._id, name: tempName.trim() });
                          setIsRenaming(false);
                        }
                      }}
                    />
                    <button 
                      onClick={async () => {
                        if (tempName.trim()) {
                          await renameUserForced({ userId: partner._id, name: tempName.trim() });
                          setIsRenaming(false);
                        }
                      }}
                      className="bg-emerald-500 text-neutral-950 p-2 rounded-full hover:scale-105 transition-all"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                ) : (
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3 group">
                    <span className="uppercase">{firstName}'s Grind</span>
                    <button onClick={() => { setIsRenaming(true); setTempName(partner.name); }} className="text-neutral-600 opacity-0 group-hover:opacity-100 hover:text-emerald-500 transition-all">
                      <Edit2 size={18} />
                    </button>
                  </h1>
                )}
              </div>
              <div className="text-neutral-400 mt-2 text-sm sm:text-base flex items-center justify-between w-full">
                <p className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Day {currentDay} of 75
                </p>
                <button onClick={() => setIsLinking(true)} className="flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition">
                  <LinkIcon size={12} /> Manage Link
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Link Manager Modal */}
        {isLinking && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-950 border border-neutral-800 p-8 rounded-3xl max-w-md w-full relative drop-shadow-[0_0_50px_rgba(16,185,129,0.1)]">
              <button onClick={() => setIsLinking(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white"><X size={20} /></button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/50">
                  <LinkIcon className="text-emerald-500" size={18} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Hardwire Partner</h2>
              </div>
              <p className="text-sm text-neutral-400 mb-6 font-mono leading-relaxed">
                Connect directly to your physical partner. This overrides any algorithmic logic.
              </p>
              
              <div className="space-y-3 max-h-64 overflow-y-auto mb-6 pr-2">
                {allPartners === undefined ? (
                  <p className="text-neutral-500 text-xs font-mono">Scanning grid...</p>
                ) : allPartners.length === 0 ? (
                  <p className="text-neutral-500 text-xs font-mono">No other users found on the network.</p>
                ) : (
                  allPartners.map((u) => (
                    <button 
                      key={u._id}
                      onClick={async () => {
                        await linkPartnerId({ partnerId: u._id });
                        setIsLinking(false);
                      }}
                      className="w-full text-left bg-neutral-900 border border-neutral-800 p-4 rounded-xl hover:border-emerald-500/50 hover:bg-neutral-800 transition-all flex justify-between items-center group"
                    >
                      <span className="font-bold text-white tracking-widest uppercase">{u.name}</span>
                      <ShieldCheck size={16} className="text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Difficulty Wall Interactive Section */}
        {isVouchPending && (
          <div className="bg-amber-500/10 border border-amber-500/50 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(245,158,11,0.1)] mb-8">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="font-black uppercase tracking-widest text-sm text-amber-500">Backfill Vouch Requested</h3>
            </div>
            <p className="text-white/80 text-xs mb-6 leading-relaxed">
              {firstName} is requesting a backfill vouch for yesterday's grind. By approving, you verify they maintained the challenge and restore their streak.
            </p>
            <div className="flex gap-3">
              <button onClick={() => resolveVouch({ logId: log._id, approved: true })} className="flex-1 bg-amber-500 text-neutral-950 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Check size={16} /> Approve
              </button>
              <button onClick={() => resolveVouch({ logId: log._id, approved: false })} className="flex-1 bg-white/5 border border-white/10 text-white/70 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all">
                <X size={16} /> Deny
              </button>
            </div>
          </div>
        )}
        
        {isVouched && (
          <div className="mb-8">
            <p className="text-emerald-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <CheckCircle size={16} /> You vouched for {firstName} today.
            </p>
          </div>
        )}
        
        {isFailed && (
          <div className="mb-8">
            <p className="text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <X size={16} /> You denied {firstName}'s vouch request.
            </p>
          </div>
        )}

        {/* 75 Hard Daily Matrix (Read Only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-90">
          
          {/* Workout 1 (Outdoor) */}
          <div className={`relative overflow-hidden border p-5 rounded-2xl shadow-sm transition-all z-0 ${isW1Met ? 'border-emerald-500/30' : 'bg-neutral-900/50 border-neutral-800/50'}`}>
            <div className={`absolute inset-0 bg-emerald-500/10 transition-opacity duration-1000 -z-10 ${isW1Met ? 'opacity-100' : 'opacity-0'}`} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-400 uppercase tracking-wide">Workout 1 <span className="text-neutral-500/70 text-sm">(Outdoor)</span></h3>
              <p className="text-xs text-neutral-600 mt-1 mb-4 font-mono">45 MIN MINIMUM</p>
              <div className={`w-full py-4 rounded-xl border transition-all font-black text-sm flex items-center justify-center gap-3 uppercase tracking-wider ${
                isW1Met 
                ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" 
                : "bg-neutral-950/50 text-neutral-600 border-neutral-800/50"
              }`}>
                {isW1Met ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-current rounded-full opacity-50" />}
                OUTDOOR WORKOUT
              </div>
            </div>
          </div>

          {/* Workout 2 */}
          <div className={`relative overflow-hidden border p-5 rounded-2xl shadow-sm transition-all z-0 ${isW2Met ? 'border-emerald-500/30' : 'bg-neutral-900/50 border-neutral-800/50'}`}>
            <div className={`absolute inset-0 bg-emerald-500/10 transition-opacity duration-1000 -z-10 ${isW2Met ? 'opacity-100' : 'opacity-0'}`} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-400 uppercase tracking-wide">Workout 2</h3>
              <p className="text-xs text-neutral-600 mt-1 mb-4 font-mono">45 MIN MINIMUM</p>
              <div className={`w-full py-4 rounded-xl border transition-all font-black text-sm flex items-center justify-center gap-3 uppercase tracking-wider ${
                isW2Met 
                ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" 
                : "bg-neutral-950/50 text-neutral-600 border-neutral-800/50"
              }`}>
                {isW2Met ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-current rounded-full opacity-50" />}
                INDOOR WORKOUT
              </div>
            </div>
          </div>

          {/* Hydration */}
          <div className={`border p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden transition-all z-0 ${isWaterMet ? 'border-emerald-500/30' : 'bg-neutral-900/50 border-neutral-800/50'}`}>
            <div className={`absolute bottom-0 left-0 right-0 ${isWaterMet ? 'bg-emerald-500/10' : 'bg-emerald-500/5'} transition-all duration-1000 ease-out -z-10`} style={{height: `${Math.min((currentWaterAmountStr / 128) * 100, 100)}%`}} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-400 uppercase tracking-wide flex items-center gap-2"><Droplet size={18} className="text-emerald-500/70" /> Hydration</h3>
              <p className="text-xs text-neutral-600 mt-1 mb-4 font-mono">1 GALLON (128 {partner.vesselUnit})</p>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-3xl font-black text-white/70 tracking-tighter">
                {currentWaterAmountStr}<span className="text-sm font-bold text-neutral-600 ml-1">/ 128</span>
              </p>
            </div>
          </div>

          {/* Reading */}
          <div className={`relative overflow-hidden border p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all z-0 ${isPagesMet ? 'border-emerald-500/30' : 'bg-neutral-900/50 border-neutral-800/50'}`}>
            <div className={`absolute bottom-0 left-0 right-0 ${isPagesMet ? 'bg-emerald-500/10' : 'bg-emerald-500/5'} transition-all duration-1000 ease-out -z-10`} style={{height: `${Math.min(((log?.readingTotal || 0) / (partner.dailyReadingGoal || 10)) * 100, 100)}%`}} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-400 uppercase tracking-wide flex items-center gap-2"><BookOpen size={18} className="text-emerald-500/70" /> Reading</h3>
              <p className="text-xs text-neutral-600 mt-1 mb-4 font-mono">{partner.dailyReadingGoal} PAGES NON-FICTION</p>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-3xl font-black text-white/70 tracking-tighter">
                {log?.readingTotal || 0}<span className="text-sm font-bold text-neutral-600 ml-1">/ {partner.dailyReadingGoal}</span>
              </p>
            </div>
          </div>

          {/* Diet & Progress Pic */}
          <div className={`relative overflow-hidden border p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col justify-between transition-all z-0 ${isDisciplineMet ? 'border-emerald-500/30' : 'bg-neutral-900/50 border-neutral-800/50'}`}>
            <div className={`absolute inset-0 bg-emerald-500/10 transition-opacity duration-1000 -z-10 ${isDisciplineMet ? 'opacity-100' : 'opacity-0'}`} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-neutral-400 uppercase tracking-wide">Discipline Checks</h3>
              <p className="text-xs text-neutral-600 mt-1 mb-4 font-mono">DIET FOLLOWED. NO ALCOHOL. PICTURE TAKEN.</p>
            </div>
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
              <div className={`py-4 rounded-xl border transition-all font-black text-sm flex items-center justify-center gap-3 uppercase tracking-wider ${
                log?.diet 
                ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" 
                : "bg-neutral-950/50 text-neutral-600 border-neutral-800/50"
              }`}>
                {log?.diet ? <CheckCircle size={20} /> : <div className="w-5 h-5 border-2 border-current rounded-full opacity-50" />}
                DIET PERFECT
              </div>
              
              <div className={`py-4 rounded-xl border transition-all font-black text-sm flex items-center justify-center gap-3 uppercase tracking-wider overflow-hidden relative ${
                log?.photoStorageId 
                ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" 
                : "bg-neutral-950/50 text-neutral-600 border-neutral-800/50"
              }`}>
                {log?.photoUrl ? (
                  <>
                    <img src={log.photoUrl} alt="Progress Pic" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="relative z-10 flex items-center gap-2 drop-shadow-md text-white font-black"><CheckCircle size={20} className="text-emerald-400" /> PHOTO SECURED</div>
                  </>
                ) : (
                  <><Camera size={20} /> UPLOAD PHOTO</>
                )}
              </div>
            </div>
            
            {/* Reaction Bar */}
            {log && (
               <div className="mt-6 border-t border-neutral-800/50 pt-5 flex justify-center gap-4 relative z-10">
                 {['🔥', '💯', '🧊', '👏'].map(emoji => (
                   <button 
                     key={emoji}
                     onClick={() => addReaction({ logId: log._id, emoji })}
                     className="w-12 h-12 rounded-full bg-neutral-950/80 border border-neutral-800 text-xl hover:scale-110 hover:border-emerald-500/50 transition-all flex items-center justify-center shadow-lg"
                   >
                     {emoji}
                   </button>
                 ))}
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}