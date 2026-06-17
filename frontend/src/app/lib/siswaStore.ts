export interface StudentItem {
  id: number;
  nis: string;
  nisn: string | null;
  nik: string | null;
  nama: string;
  tahunAjaran: string;
  kelas: string;
  waliKelas: string | null;
  asalSekolah: string | null;
  namaOrangTua: string | null;
  jenisKelamin: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  alamat: string | null;
  email: string;
  telepon: string;
}

export const defaultSiswaData: StudentItem[] = [];
