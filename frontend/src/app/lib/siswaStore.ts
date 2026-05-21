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

export const defaultSiswaData: StudentItem[] = [];
