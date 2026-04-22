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

export interface KelasItem {
  id: number;
  nama: string;
  tahunAjaran: string;
  kelompok: 'Ikhwan' | 'Akhwat';
  waliKelas: string;
  jumlahSiswa: number;
}

export interface MasterPelajaran {
  id: number;
  nama: string;
  tahunAjaran: string;
}

export interface TahunAjaranItem {
  id: number;
  nama: string;
  semester: 'Ganjil' | 'Genap';
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'Aktif' | 'Draft' | 'Arsip';
}
