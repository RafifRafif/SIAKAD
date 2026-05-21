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

export const defaultGuruData: GuruItem[] = [];
