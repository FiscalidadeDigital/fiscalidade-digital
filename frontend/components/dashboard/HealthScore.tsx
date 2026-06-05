'use client';
import { motion } from 'framer-motion';

export default function HealthScore({ health }: { health: number }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-gradient-to-r from-green-500 to-lime-400 text-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all"
    >
      <h3 className="text-xl font-bold mb-2">Health Score</h3>
      <p className="text-3xl font-extrabold">{health}%</p>
      <p className="text-sm mt-1">Saúde financeira da empresa</p>
    </motion.div>
  );
}