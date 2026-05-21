export interface TahunAjaranItem {
  id: number;
  nama: string;
  semester: 'Ganjil' | 'Genap';
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'Aktif' | 'Draft' | 'Arsip';
}

export const defaultTahunAjaranData: TahunAjaranItem[] = [];
