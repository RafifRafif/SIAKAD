export interface TahunAjaranItem {
  id: number;
  nama: string;
  semester: 'Ganjil' | 'Genap';
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'Aktif' | 'Draft' | 'Arsip';
}

export const TAHUN_AJARAN_STORAGE_KEY = 'pbl4-tahun-ajaran';

export const defaultTahunAjaranData: TahunAjaranItem[] = [
  {
    id: 1,
    nama: '2025/2026',
    semester: 'Ganjil',
    tanggalMulai: '2025-07-15',
    tanggalSelesai: '2025-12-20',
    status: 'Arsip',
  },
  {
    id: 2,
    nama: '2025/2026',
    semester: 'Genap',
    tanggalMulai: '2026-01-08',
    tanggalSelesai: '2026-06-18',
    status: 'Aktif',
  },
  {
    id: 3,
    nama: '2026/2027',
    semester: 'Ganjil',
    tanggalMulai: '2026-07-13',
    tanggalSelesai: '2026-12-19',
    status: 'Draft',
  },
];
