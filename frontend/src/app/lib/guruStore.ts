export interface GuruItem {
  id: number;
  nip: string;
  nama: string;
  tahunAjaran: string;
  role: ('Wali Kelas' | 'Guru Mapel')[];
  email: string;
  telepon: string;
  status: 'Aktif' | 'Cuti';
}

export const GURU_STORAGE_KEY = 'pbl4-data-guru';

export const defaultGuruData: GuruItem[] = [
  {
    id: 1,
    nip: 'NIP001',
    nama: 'Ustadz Ahmad Fauzi, S.Pd',
    tahunAjaran: '2025/2026 Genap',
    role: ['Guru Mapel'],
    email: 'ahmad.fauzi@example.com',
    telepon: '08123456789',
    status: 'Aktif',
  },
  {
    id: 2,
    nip: 'NIP002',
    nama: 'Ustadzah Siti Nurhaliza, S.Pd.I',
    tahunAjaran: '2025/2026 Genap',
    role: ['Wali Kelas', 'Guru Mapel'],
    email: 'siti.nur@example.com',
    telepon: '08123456790',
    status: 'Aktif',
  },
  {
    id: 3,
    nip: 'NIP003',
    nama: 'Ustadz Muhammad Rizki, S.Si',
    tahunAjaran: '2026/2027 Ganjil',
    role: ['Guru Mapel'],
    email: 'rizki@example.com',
    telepon: '08123456791',
    status: 'Aktif',
  },
];
