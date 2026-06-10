export interface TahunAjaranItem {
  id: number;
  nama: string;
  semester: 'Ganjil' | 'Genap';
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'Aktif' | 'Draft' | 'Arsip';
}

export const defaultTahunAjaranData: TahunAjaranItem[] = [];

export const tahunAjaranOptionValue = (item: TahunAjaranItem) =>
  `${item.nama} ${item.semester}`;

export const tahunAjaranOptionLabel = (item: TahunAjaranItem) => {
  const value = tahunAjaranOptionValue(item);

  return item.status === 'Aktif' ? `${value} (Aktif)` : value;
};
