"use client";

import { motion } from "framer-motion";

type Props = {
  progress: number;
  remaining: string;
  running: boolean;
};

export default function FocusTimer({ progress, remaining, running }: Props) {
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="320" height="320">
        <circle
          cx="160"
          cy="160"
          r={radius}
          stroke="#1E1B4B"
          strokeWidth="12"
          fill="none"
        />
        <motion.circle
          cx="160"
          cy="160"
          r={radius}
          stroke="#2DD4BF"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            filter: running
              ? "drop-shadow(0 0 16px rgba(45,212,191,0.25))"
              : "none",
          }}
        />
      </svg>

      <div className="absolute text-5xl font-semibold tracking-tight tabular-nums">
        {remaining}
      </div>
    </div>
  );
}
