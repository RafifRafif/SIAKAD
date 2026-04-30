import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export function EmptyState({
  message = 'Tidak ada data',
  description = 'Data akan muncul di sini setelah ditambahkan',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FileQuestion size={40} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-600 max-w-md">{description}</p>
    </div>
  );
}
