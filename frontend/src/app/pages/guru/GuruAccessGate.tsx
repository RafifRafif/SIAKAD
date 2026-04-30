'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getCurrentGuruAccess, type GuruAccess } from '../../lib/authStore';

interface GuruAccessGateProps {
  requiredAccess: GuruAccess;
  children: ReactNode;
}

export default function GuruAccessGate({ requiredAccess, children }: GuruAccessGateProps) {
  const [access, setAccess] = useState<GuruAccess[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setAccess(getCurrentGuruAccess());
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!access.includes(requiredAccess)) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldAlert size={26} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Akses tidak tersedia</h2>
          <p className="mt-2 text-sm text-gray-600">
            Fitur ini hanya ditampilkan untuk guru dengan akses {requiredAccess}.
            Silakan hubungi admin jika akses Anda perlu diubah.
          </p>
          <Link
            href="/guru"
            className="mt-6 inline-flex rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
