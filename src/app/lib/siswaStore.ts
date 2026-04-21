export interface StudentItem {
  id: number;
  nis: string;
  nama: string;
  tahunAjaran: string;
  kelas: string;
  jenisKelamin: string;
  email: string;
  telepon: string;
}

export const SISWA_STORAGE_KEY = 'pbl4-data-siswa';

export const defaultSiswaData: StudentItem[] = [
  {
    id: 1,
    nis: '2024001',
    nama: 'Ahmad Fauzi',
    tahunAjaran: '2025/2026 Genap',
    kelas: 'X-A',
    jenisKelamin: 'Laki-laki',
    email: 'ahmad@example.com',
    telepon: '08123456789',
  },
  {
    id: 2,
    nis: '2024002',
    nama: 'Siti Nurhaliza',
    tahunAjaran: '2025/2026 Genap',
    kelas: 'X-A',
    jenisKelamin: 'Perempuan',
    email: 'siti@example.com',
    telepon: '08123456790',
  },
  {
    id: 3,
    nis: '2024003',
    nama: 'Muhammad Rizki',
    tahunAjaran: '2025/2026 Genap',
    kelas: 'XI-B',
    jenisKelamin: 'Laki-laki',
    email: 'rizki@example.com',
    telepon: '08123456791',
  },
  {
    id: 4,
    nis: '2024004',
    nama: 'Fatimah Azzahra',
    tahunAjaran: '2026/2027 Ganjil',
    kelas: 'XI-A',
    jenisKelamin: 'Perempuan',
    email: 'fatimah@example.com',
    telepon: '08123456792',
  },
  {
    id: 5,
    nis: '2024005',
    nama: 'Abdullah Rahman',
    tahunAjaran: '2026/2027 Ganjil',
    kelas: 'XII-A',
    jenisKelamin: 'Laki-laki',
    email: 'abdullah@example.com',
    telepon: '08123456793',
  },
];
