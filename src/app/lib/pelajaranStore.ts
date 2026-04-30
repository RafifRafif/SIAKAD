export interface MasterPelajaran {
  id: number;
  nama: string;
  tahunAjaran: string;
}

export const MASTER_PELAJARAN_STORAGE_KEY = 'pbl4-master-pelajaran';

export const defaultMasterPelajaran: MasterPelajaran[] = [
  { id: 1, nama: 'Matematika', tahunAjaran: '2025/2026 Genap' },
  { id: 2, nama: 'Bahasa Arab', tahunAjaran: '2025/2026 Genap' },
  { id: 3, nama: 'Tahsin & Tahfidz', tahunAjaran: '2026/2027 Ganjil' },
  { id: 4, nama: 'Fisika', tahunAjaran: '2026/2027 Ganjil' },
];
