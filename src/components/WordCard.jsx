import { motion } from "framer-motion";

export default function WordCard({ masked, pos, meaning, isCorrect, isWrong }) {
  return (
    <motion.div
      animate={
        isCorrect
          ? { y: -8, boxShadow: "0 0 12px #22c55e" }
          : isWrong
          ? { boxShadow: ["0 0 0px #ef4444", "0 0 16px #ef4444", "0 0 0px #ef4444"] }
          : {}
      }
      transition={{ duration: 0.25 }}
      className="w-full bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-2"
    >
      <div className="text-3xl tracking-wider font-mono">{masked}</div>
      <div className="text-gray-500">{pos}</div>
      <div className="text-gray-700">{meaning}</div>
    </motion.div>
  );
}
