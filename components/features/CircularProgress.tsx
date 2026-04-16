"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number; // Current progress
  max?: number; // Maximum target (default 100)
  label?: string; // e.g., "Water", "Reading"
  size?: number; // Pixel size of the component
  strokeWidth?: number; // Thickness of the ring
  colorClass?: string; // Tailwind text color class
}

export function CircularProgress({
  value,
  max = 100,
  label,
  size = 120,
  strokeWidth = 12,
  colorClass = "text-blue-500",
}: CircularProgressProps) {
  // Math for the SVG circle
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Ensure we don't go below 0 or above the max
  const safeValue = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? safeValue / max : 0;
  
  // Calculate how much of the ring should be empty
  const offset = circumference - percent * circumference;

  return (
    <div 
      className="relative flex flex-col items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          className="text-slate-100 dark:text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated Progress Circle */}
        <motion.circle
          className={cn("transition-colors duration-300", colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        />
      </svg>
      
      {/* Center Label inside the ring */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {Math.round(percent * 100)}%
        </span>
        {label && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}