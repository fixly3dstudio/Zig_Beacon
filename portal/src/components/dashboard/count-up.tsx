"use client";

import { useEffect } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [count, value]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
