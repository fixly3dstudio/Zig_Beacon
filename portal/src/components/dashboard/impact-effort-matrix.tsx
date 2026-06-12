"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export type MatrixOpportunity = {
  id: number;
  problem: string;
  impact: number; // 1–10
  effort: number; // 1–10
  score: number;
  status: string;
};

const W = 100; // viewBox units, rendered responsively
const H = 100;

function statusColor(status: string) {
  if (status === "in-progress") return "#0367fc";
  if (status === "planned") return "#0a0a0a";
  return "#a1a1aa"; // backlog / other
}

export function ImpactEffortMatrix({ opportunities }: { opportunities: MatrixOpportunity[] }) {
  const [active, setActive] = useState<MatrixOpportunity | null>(null);

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Impact versus effort matrix of opportunities">
          {/* quadrant background */}
          <rect x="0" y="0" width={W / 2} height={H / 2} fill="rgba(3,103,252,0.04)" />
          {/* grid */}
          <line x1={W / 2} y1="0" x2={W / 2} y2={H} stroke="#e4e4e7" strokeWidth="0.4" />
          <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#e4e4e7" strokeWidth="0.4" />
          <rect x="0.2" y="0.2" width={W - 0.4} height={H - 0.4} fill="none" stroke="#e4e4e7" strokeWidth="0.4" rx="2" />

          {/* quadrant labels */}
          <text x="3" y="6" fontSize="3.4" fill="#0367fc" fontWeight="600">QUICK WINS</text>
          <text x={W / 2 + 3} y="6" fontSize="3.4" fill="#a1a1aa" fontWeight="600">BIG BETS</text>
          <text x="3" y={H - 3} fontSize="3.4" fill="#a1a1aa" fontWeight="600">FILL-INS</text>
          <text x={W / 2 + 3} y={H - 3} fontSize="3.4" fill="#a1a1aa" fontWeight="600">RECONSIDER</text>

          {opportunities.map((o, i) => {
            // effort 1–10 → x, impact 1–10 → y (high impact at top)
            const x = 6 + ((o.effort - 1) / 9) * (W - 12);
            const y = 6 + (1 - (o.impact - 1) / 9) * (H - 12);
            const r = 2.2 + (o.score / 130) * 2.2;
            return (
              <motion.circle
                key={o.id}
                cx={x}
                cy={y}
                r={r}
                fill={statusColor(o.status)}
                fillOpacity={active && active.id !== o.id ? 0.25 : 0.9}
                className="cursor-pointer"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
                onMouseEnter={() => setActive(o)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </svg>

        {/* hover detail */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-1 flex justify-center">
          {active && (
            <div className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs shadow-sm">
              <span className="font-medium text-foreground">{active.problem}</span>
              <span className="ml-2 text-muted">
                Impact {active.impact} · Effort {active.effort} · Score {active.score}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
        <span>← Low effort</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand" /> In progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-foreground" /> Planned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-400" /> Backlog
          </span>
        </div>
        <span>High effort →</span>
      </div>
    </div>
  );
}
