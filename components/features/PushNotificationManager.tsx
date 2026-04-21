"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BellRing, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const saveSubscription = useMutation(api.pushSubs.saveSubscription);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      
      const skipped = localStorage.getItem("gritify_skip_push");
      if (Notification.permission === "default" && skipped === "true") {
        setPermissionState("denied");
      } else {
        setPermissionState(Notification.permission);
      }
      
      // If they already granted it, sync the sub silently
      if (Notification.permission === 'granted') {
        syncSubscription();
      }
    }
  }, []);

  const syncSubscription = async (forceRequest = false) => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription && forceRequest) {
        const permission = await Notification.requestPermission();
        setPermissionState(permission);
        if (permission === 'granted') {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        }
      }

      if (subscription) {
        await saveSubscription({ subscription: JSON.parse(JSON.stringify(subscription)) });
        return true;
      }
    } catch (err) {
      console.error("Error setting up push notifications", err);
    }
    return false;
  };

  const handleGrant = async () => {
    localStorage.setItem("gritify_skip_push", "true");
    const success = await syncSubscription(true);
    // Explicitly hide the dialog once they interacted (whether system blocks, grants, or denies)
    // Sometimes the browser native pop up handles it incorrectly, so we wipe out 'default'
    if (Notification.permission !== "default") {
      setPermissionState(Notification.permission);
    } else {
      // Hard fallback if native overlay doesn't fire but they clicked it
      setPermissionState("denied"); 
    }
  };

  if (!isSupported) return null;

  // We only show the interceptor modal if we haven't asked them yet (default)
  return (
    <AnimatePresence>
      {permissionState === "default" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            className="bg-neutral-900 border border-emerald-500/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] relative z-10 w-full max-w-md text-center"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BellRing className="w-10 h-10 text-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Stay Locked In</h2>
            <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
              To hold your partner accountable, you <span className="text-emerald-500 font-bold">must</span> enable push notifications. You'll instantly know when they grind, slip up, or send custom reactions.
            </p>
            <button 
              onClick={handleGrant}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest rounded-xl transition-all uppercase text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} /> Enable Comms Channel
            </button>
            <button 
              onClick={() => {
                localStorage.setItem("gritify_skip_push", "true");
                setPermissionState("denied");
              }}
              className="mt-4 text-xs font-bold text-neutral-600 uppercase hover:text-neutral-400 tracking-wider transition-colors"
            >
              Skip (Not Recommended)
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
