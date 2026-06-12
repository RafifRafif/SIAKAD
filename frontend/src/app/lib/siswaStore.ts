export interface StudentItem {
  id: number;
  nis: string;
  nama: string;
  tahunAjaran: string;
  kelas: string;
  jenisKelamin: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  alamat: string | null;
  email: string;
  telepon: string;
}

export const defaultSiswaData: StudentItem[] = [];
