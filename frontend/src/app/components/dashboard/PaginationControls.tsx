'use client';

type PaginationControlsProps = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  currentPage,
  totalItems,
  itemsPerPage,
  itemLabel,
  onPageChange,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
      <p className="text-sm text-gray-600">
        Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari{' '}
        {totalItems} {itemLabel}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded-lg px-4 py-2 ${
              currentPage === page
                ? 'bg-[#2563EB] text-white'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
