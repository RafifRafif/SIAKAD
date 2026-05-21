export interface KelasItem {
  id: number;
  nama: string;
  tahunAjaran: string;
  kelompok: 'Ikhwan' | 'Akhwat';
  waliKelas: string;
  jumlahSiswa: number;
}

export const defaultKelasData: KelasItem[] = [];
