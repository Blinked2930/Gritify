"use client";

import { useState, useEffect } from 'react';
import { Share, PlusSquare, MoreVertical, MoreHorizontal, Smartphone, Apple, X, Check } from 'lucide-react';
import { useUser } from "@clerk/nextjs";

export function PwaInstallPrompt({ onBypass }: { onBypass?: () => void }) {
  const { isSignedIn, isLoaded } = useUser();
  const [device, setDevice] = useState<'none' | 'ios' | 'android'>('none');
  const [isStandalone, setIsStandalone] = useState(true); 

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone || 
                    document.referrer.includes('android-app://');
      
      const hasBypassed = localStorage.getItem('gritify_bypassed_install') === 'true';
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Hide if already installed, previously bypassed, or if they are on a desktop
      setIsStandalone(isPWA || hasBypassed || !isMobile);
    }
  }, []);

  const handleBypass = () => {
    localStorage.setItem('gritify_bypassed_install', 'true');
    setIsStandalone(true);
    if (onBypass) onBypass();
  };

  // CRITICAL: Only render the install prompt AFTER the user has authenticated
  if (!isLoaded || !isSignedIn || isStandalone) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      
      <div className="w-16 h-16 bg-neutral-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-neutral-800">
        <Smartphone size={32} className="text-emerald-500" />
      </div>
      
      <h1 className="text-3xl font-black text-white mb-3 tracking-tight uppercase text-center">Protocol Initialized</h1>
      <p className="text-neutral-400 text-center text-sm font-medium leading-relaxed max-w-xs mb-10">
        Account secured. To ensure maximum telemetry reliability and native performance, this tool must now be installed directly to your device.
      </p>

      {device === 'none' ? (
        <div className="w-full max-w-xs space-y-4">
          <button 
            onClick={() => setDevice('ios')}
            className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-2xl p-4 flex items-center justify-center gap-3 font-bold active:scale-95 transition-all shadow-sm"
          >
            <Apple size={20} /> I have an iPhone
          </button>
          <button 
            onClick={() => setDevice('android')}
            className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-2xl p-4 flex items-center justify-center gap-3 font-bold active:scale-95 transition-all shadow-sm"
          >
            <Smartphone size={20} /> I have an Android
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 shadow-2xl rounded-[2rem] p-6 relative animate-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => setDevice('none')}
            className="absolute top-4 right-4 w-8 h-8 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-colors"
          >
            <X size={16} />
          </button>
          
          <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
            {device === 'ios' ? 'iOS Installation' : 'Android Installation'}
          </h2>
          
          {device === 'ios' ? (
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6">Must be in Safari Browser</p>
          ) : (
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">Must be in Chrome Browser</p>
          )}

          <div className="space-y-5 text-neutral-300 text-sm font-medium mb-8">
            {device === 'ios' ? (
              <>
                <div className="flex items-start gap-4">
                  <MoreHorizontal size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p>Tap the <strong className="text-white font-bold">3-dot menu</strong> in the bottom right corner.</p>
                </div>
                <div className="flex items-start gap-4">
                  <Share size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p>Tap the <strong className="text-white font-bold">Share</strong> icon.</p>
                </div>
                <div className="flex items-start gap-4">
                  <PlusSquare size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p>Scroll down and tap <strong className="text-white font-bold">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-4">
                  <Check size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p>Tap <strong className="text-white font-bold">Add</strong> in the top right corner.</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <MoreVertical size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p>Tap the <strong className="text-white font-bold">3-dot menu</strong> in the top right corner of Chrome.</p>
                </div>
                <div className="flex items-start gap-4">
                  <PlusSquare size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p>Tap <strong className="text-white font-bold">Add to Home screen</strong> or <strong className="text-white font-bold">Install app</strong>.</p>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => setDevice('none')}
            className="w-full py-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white rounded-2xl font-bold active:scale-95 transition-all"
          >
            Back
          </button>
        </div>
      )}

      <button 
        onClick={handleBypass}
        className="mt-8 text-[10px] font-bold text-neutral-500 underline underline-offset-4 hover:text-neutral-300 transition-colors uppercase tracking-widest"
      >
        Continue in browser (Not Recommended)
      </button>
    </div>
  );
}