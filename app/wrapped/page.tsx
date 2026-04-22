"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Droplets, BookOpen, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function WrappedDashboard() {
  const existingWrapped = useQuery(api.wrapped.getMyWrapped);
  const generateWrapped = useAction(api.wrapped.generateWrapped);
  const user = useQuery(api.logs.getMe);
  const searchParams = useSearchParams();
  const isTest = searchParams.get("test") === "true";
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing Gemini Matrix...");
  const [localWrapped, setLocalWrapped] = useState<any>(null);

  // Use either the freshly generated data, or the data saved in the database
  const activeData = localWrapped || existingWrapped;

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Fake loading steps for the vibe
    setTimeout(() => setLoadingText("Quantifying Hydration Levels..."), 1500);
    setTimeout(() => setLoadingText("Reading Vault Entries..."), 3000);
    setTimeout(() => setLoadingText("Synthesizing Shëngjin Reality..."), 4500);

    try {
      const result = await generateWrapped();
      setLocalWrapped(result); // We mock the full object shape from the Action return
    } catch (error) {
      console.error(error);
      setLoadingText("System Failure. Are you authenticated?");
    } finally {
      setIsGenerating(false);
    }
  };

  // If Convex is still checking auth/db, show a generic spinner
  if (existingWrapped === undefined || user === undefined) {
    return (
      <div className="min-h-screen bg-grit-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-grit-purple animate-spin" />
      </div>
    );
  }

  // Calculate current day
  let currentDay = 1;
  const now = new Date();
  now.setHours(now.getHours() - 2);
  if (user?.challengeStartDate) {
    const start = new Date(user.challengeStartDate);
    start.setHours(start.getHours() - 2);
    start.setHours(0,0,0,0);
    const todayStr = new Date(now);
    todayStr.setHours(0,0,0,0);
    const diffTime = Math.abs(todayStr.getTime() - start.getTime());
    currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  if (!user?.isDemo && currentDay <= 75 && !isTest) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-50 p-6 flex flex-col items-center justify-center text-center pb-24 font-sans">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl mb-6">
          <Activity className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-black mb-4 uppercase">Access Denied.</h1>
        <p className="text-neutral-400 mb-8 max-w-sm">
          You are on <strong>Day {currentDay}</strong>. The Gritify Wrapped synthesis is highly classified and will only unlock when you complete the full 75 days. Keep grinding.
        </p>
        <Link href="/" className="bg-neutral-900 border border-neutral-800 px-8 py-4 rounded-full font-black uppercase text-sm hover:bg-neutral-800 transition-colors">
          Return to Command
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-grit-obsidian text-white p-6 font-sans overflow-x-hidden relative">
      
      {/* Header */}
      <header className="pt-6 mb-12 flex items-start gap-4 relative z-10">
        <Link href="/" className="mt-1 bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-grit-purple w-5 h-5" />
            <span className="text-grit-purple font-black text-sm uppercase tracking-widest">
              Endgame
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Your Wrapped.</h1>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* STATE 1 & 2: GENERATING OR WAITING TO GENERATE */}
        {!activeData ? (
          <motion.div 
            key="generate-state"
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center mt-24"
          >
            {isGenerating ? (
              <div className="flex flex-col items-center text-center max-w-xs">
                <Activity className="w-16 h-16 text-grit-cyan animate-pulse mb-8" />
                <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2 animate-bounce">
                  Processing
                </h2>
                <p className="text-grit-cyan/80 text-sm font-mono">{loadingText}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="bg-grit-purple/10 p-6 rounded-full border border-grit-purple/20 mb-8 shadow-[0_0_50px_rgba(181,51,255,0.15)]">
                  <Sparkles className="w-12 h-12 text-grit-purple" />
                </div>
                <h2 className="text-2xl font-black mb-4">75 Days of Grit.</h2>
                <p className="text-white/50 max-w-sm mb-12">
                  Are you ready to let the AI judge your journey? This will analyze every ounce of water, page read, and Vault entry.
                </p>
                <button 
                  onClick={handleGenerate}
                  className="w-full bg-grit-purple text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(181,51,255,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  Generate Synthesis
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* STATE 3: THE REVEAL */
          <motion.div 
            key="reveal-state"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, staggerChildren: 0.2 }}
            className="space-y-8 pb-24"
          >
            {/* The Vibe Title */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-center py-8"
            >
              <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-4">
                Your AI-Designated Vibe
              </p>
              <h2 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-grit-cyan to-grit-purple uppercase italic">
                {activeData.visualTheme || "Unknown Entity"}
              </h2>
            </motion.div>

            {/* The Hard Stats */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center"
              >
                <Droplets className="w-8 h-8 text-grit-cyan mb-3" />
                <span className="text-3xl font-black">{activeData.totalWater || (activeData as any).totalWater}</span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Ounces Drank</span>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center"
              >
                <BookOpen className="w-8 h-8 text-grit-purple mb-3" />
                <span className="text-3xl font-black">{activeData.totalPages || (activeData as any).totalPages}</span>
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Pages Read</span>
              </motion.div>
            </div>

            {/* The Judgment (AI Summary) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-grit-orange via-grit-purple to-grit-cyan" />
              <h3 className="text-lg font-black uppercase tracking-widest mb-6 ml-4">The Verdict</h3>
              
              <div className="space-y-6 ml-4 text-white/80 leading-relaxed text-sm">
                {/* Splitting the AI paragraphs nicely */}
                {activeData.aiSummary?.split('\n\n').map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function WrappedDashboardWrapper() {
  return (
    <Suspense fallback={<div>Loading Wrapped...</div>}>
      <WrappedDashboard />
    </Suspense>
  );
}