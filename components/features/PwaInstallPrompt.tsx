"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smartphone, Share, PlusSquare, MoreHorizontal, Apple, MonitorSmartphone } from "lucide-react";

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [step, setStep] = useState<"initial" | "ios" | "android">("initial");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if the app is already installed and running as a PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      const hasSkipped = localStorage.getItem('gritify_skip_install');
      
      // Only show the prompt on mobile devices that haven't installed or skipped
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (!isStandalone && !hasSkipped && isMobile) {
        setShowPrompt(true);
      }
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('gritify_skip_install', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {step === "initial" && (
          <motion.div 
            key="initial"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Smartphone size={32} className="text-emerald-500" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Install App</h2>
            <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
              To ensure reliability offline and enable push notifications, this protocol engine must be installed to your home screen.
            </p>

            <div className="w-full space-y-3">
              <button 
                onClick={() => setStep("ios")}
                className="w-full py-4 bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
              >
                <Apple size={20} /> I have an iPhone
              </button>
              
              <button 
                onClick={() => setStep("android")}
                className="w-full py-4 bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
              >
                <MonitorSmartphone size={20} /> I have an Android
              </button>
            </div>

            <button onClick={dismiss} className="mt-8 text-[10px] uppercase tracking-widest font-bold text-neutral-600 hover:text-neutral-400 transition-colors underline decoration-neutral-700 underline-offset-4">
              Continue in browser (Not Recommended)
            </button>
          </motion.div>
        )}

        {step === "ios" && (
          <motion.div 
            key="ios"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm"
          >
            <h2 className="text-xl font-black text-white mb-2 tracking-tight text-center">iOS Installation</h2>
            <p className="text-red-400 text-[10px] font-bold tracking-widest uppercase text-center mb-8">Must be in Safari Browser</p>

            <div className="space-y-6 text-sm text-neutral-300 font-medium">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-neutral-950 rounded-xl flex items-center justify-center shrink-0 border border-neutral-800">
                  <Share size={18} className="text-emerald-500" />
                </div>
                <p>Tap the <strong className="text-white">Share</strong> icon at the bottom of Safari.</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-neutral-950 rounded-xl flex items-center justify-center shrink-0 border border-neutral-800">
                  <PlusSquare size={18} className="text-emerald-500" />
                </div>
                <p>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-neutral-950 rounded-xl flex items-center justify-center shrink-0 border border-neutral-800">
                  <span className="text-emerald-500 font-bold">Add</span>
                </div>
                <p>Tap <strong className="text-white">Add</strong> in the top right corner.</p>
              </div>
            </div>

            <button onClick={() => setStep("initial")} className="w-full py-4 mt-8 bg-neutral-950 text-white font-bold rounded-2xl transition-all border border-neutral-800">
              Back
            </button>
          </motion.div>
        )}

        {step === "android" && (
          <motion.div 
            key="android"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm"
          >
            <h2 className="text-xl font-black text-white mb-2 tracking-tight text-center">Android Installation</h2>
            <p className="text-red-400 text-[10px] font-bold tracking-widest uppercase text-center mb-8">Must be in Chrome Browser</p>

            <div className="space-y-6 text-sm text-neutral-300 font-medium">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-neutral-950 rounded-xl flex items-center justify-center shrink-0 border border-neutral-800">
                  <MoreHorizontal size={18} className="text-emerald-500" />
                </div>
                <p>Tap the <strong className="text-white">3-dot menu</strong> in the top right corner.</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-neutral-950 rounded-xl flex items-center justify-center shrink-0 border border-neutral-800">
                  <MonitorSmartphone size={18} className="text-emerald-500" />
                </div>
                <p>Tap <strong className="text-white">Install App</strong> or <strong className="text-white">Add to Home screen</strong>.</p>
              </div>
            </div>

            <button onClick={() => setStep("initial")} className="w-full py-4 mt-8 bg-neutral-950 text-white font-bold rounded-2xl transition-all border border-neutral-800">
              Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}