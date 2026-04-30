import { motion } from 'motion/react';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-[#2563EB] border-t-transparent rounded-full"
      />
      <p className="mt-4 text-gray-600">Memuat data...</p>
    </div>
  );
}
