import type { Metadata } from 'next';
import '@/styles/index.css';

export const metadata: Metadata = {
  title: 'SIAKAD',
  description: 'Sistem Informasi Akademik SMA IT Ulil Albab',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
