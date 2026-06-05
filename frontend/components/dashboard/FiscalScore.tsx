'use client';
import { motion } from 'framer-motion';

export default function FiscalScore({ score }: { score: number }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all"
    >
      <h3 className="text-xl font-bold mb-2">Fiscal Score</h3>
      <p className="text-3xl font-extrabold">{score}%</p>
      <p className="text-sm mt-1">Indicador de conformidade fiscal</p>
    </motion.div>
  );
}