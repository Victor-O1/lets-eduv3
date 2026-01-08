"use client";

import { motion } from "framer-motion";

export default function FocusButton({
  running,
  onClick,
}: {
  running: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className={`
        mt-8 px-10 py-4 rounded-full text-white text-lg
        bg-indigo-900
        ${running ? "shadow-[0_0_24px_rgba(45,212,191,0.25)]" : ""}
      `}
    >
      {running ? "Pause" : "Start"}
    </motion.button>
  );
}
