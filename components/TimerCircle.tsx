"use client";

const RADIUS = 110;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// visual choice: one full revolution = 60 minutes
const SECONDS_PER_LAP = 60 * 60;

export default function TimerCircle({ elapsed }: { elapsed: number }) {
  const progress = (elapsed % SECONDS_PER_LAP) / SECONDS_PER_LAP;

  const strokeOffset = CIRCUMFERENCE * (1 - progress);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      {/* SVG CIRCLE */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 260 260"
        className="-rotate-90"
      >
        {/* BACKGROUND RING */}
        <circle
          cx="130"
          cy="130"
          r={RADIUS}
          fill="transparent"
          stroke="#1E1B4B"
          strokeWidth={STROKE}
        />

        {/* PROGRESS RING */}
        <circle
          cx="130"
          cy="130"
          r={RADIUS}
          fill="transparent"
          stroke="#6366F1"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeOffset}
          style={{
            transition: "stroke-dashoffset 1s linear",
          }}
        />
      </svg>

      {/* TIME TEXT */}
      <span className="absolute text-5xl font-semibold tabular-nums">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:
        {String(s).padStart(2, "0")}
      </span>
    </div>
  );
}
