"use client";

import { motion } from "framer-motion";

export function AnimatedBar({
  pct,
  color,
  delay = 0,
}: {
  pct: number;
  color: string;
  delay?: number;
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay }}
      />
    </div>
  );
}
