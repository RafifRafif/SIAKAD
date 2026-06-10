import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  detailHref?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  color = 'bg-blue-100 text-blue-600',
  detailHref,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? 'Naik' : 'Turun'} {trend}
            </p>
          )}
          {detailHref && (
            <Link
              href={detailHref}
              className="mt-4 inline-flex text-sm font-semibold text-[#2563EB] transition-colors hover:text-blue-700 hover:underline"
            >
              Lihat Detail
            </Link>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
}
