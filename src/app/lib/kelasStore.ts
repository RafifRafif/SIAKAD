export interface KelasItem {
  id: number;
  nama: string;
  tahunAjaran: string;
  kelompok: 'Ikhwan' | 'Akhwat';
  waliKelas: string;
  jumlahSiswa: number;
}

export const KELAS_STORAGE_KEY = 'pbl4-data-kelas';

export const defaultKelasData: KelasItem[] = [
  { id: 1, nama: 'X-A', tahunAjaran: '2025/2026 Genap', kelompok: 'Akhwat', waliKelas: 'Ustadzah Siti Nurhaliza', jumlahSiswa: 32 },
  { id: 2, nama: 'XI-B', tahunAjaran: '2025/2026 Genap', kelompok: 'Ikhwan', waliKelas: 'Ustadz Ahmad Fauzi', jumlahSiswa: 30 },
  { id: 3, nama: 'XII-A', tahunAjaran: '2026/2027 Ganjil', kelompok: 'Ikhwan', waliKelas: 'Ustadz Muhammad Rizki', jumlahSiswa: 28 },
];
