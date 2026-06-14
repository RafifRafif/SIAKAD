'use client';

import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

type DeleteConfirmationDialogProps = {
  title: string;
  description: string;
  itemName?: string;
  confirmLabel?: string;
  children: ReactNode;
  onConfirm: () => void | Promise<void>;
};

export function DeleteConfirmationDialog({
  title,
  description,
  itemName,
  confirmLabel = 'Hapus',
  children,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-md rounded-xl border border-red-100 bg-white p-0 shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <AlertDialogHeader className="gap-1 text-left">
              <AlertDialogTitle className="text-lg font-bold text-gray-900">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-gray-600">
                {description}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
        </div>

        {itemName && (
          <div className="mx-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {itemName}
          </div>
        )}

        <AlertDialogFooter className="gap-3 px-6 pb-6 pt-2 sm:justify-end">
          <AlertDialogCancel
            disabled={isDeleting}
            className="mt-0 rounded-lg border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Trash2 size={16} />
            {isDeleting ? 'Menghapus...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
