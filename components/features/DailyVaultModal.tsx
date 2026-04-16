"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Send } from "lucide-react";

interface DailyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (qAndA: { question: string; answer: string }[]) => void;
  initialData?: { question: string; answer: string }[];
}

// These are our starting questions. We can randomize these later!
const DAILY_PROMPTS = [
  "What was the hardest part of the grind today?",
  "What did you learn from your reading today?",
  "Shëngjin Vibe Check: What was the most unique or Albanian thing that happened today?"
];

export function DailyVaultModal({ isOpen, onClose, onSave, initialData = [] }: DailyVaultModalProps) {
  // Pre-fill with existing data if they already answered, otherwise set up empty strings
  const [answers, setAnswers] = useState<string[]>(
    DAILY_PROMPTS.map((prompt, i) => initialData[i]?.answer || "")
  );

  const handleSave = () => {
    const formattedData = DAILY_PROMPTS.map((prompt, i) => ({
      question: prompt,
      answer: answers[i] || "",
    }));
    onSave(formattedData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-grit-obsidian border-t border-white/10 rounded-t-[3rem] p-6 z-50 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <Lock className="text-grit-purple w-5 h-5" />
                <h2 className="text-xl font-black uppercase tracking-widest text-white">The Vault</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pb-24 no-scrollbar">
              {DAILY_PROMPTS.map((prompt, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                  <p className="text-sm font-bold text-grit-purple mb-3 uppercase tracking-wider">
                    {prompt}
                  </p>
                  <textarea
                    value={answers[idx]}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[idx] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    placeholder="Enter the grid..."
                    className="w-full bg-transparent text-white placeholder-white/20 resize-none outline-none min-h-[80px]"
                  />
                </div>
              ))}
            </div>

            {/* Sticky Save Button */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-grit-obsidian via-grit-obsidian to-transparent">
              <button 
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 bg-grit-purple text-white py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_20px_rgba(181,51,255,0.4)]"
              >
                Seal Vault <Send size={18} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}