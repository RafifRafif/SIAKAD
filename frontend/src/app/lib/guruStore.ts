export interface GuruItem {
  id: number;
  nip: string;
  nuptk?: string | null;
  nik?: string | null;
  nama: string;
  tahunAjaran: string;
  role: ('Wali Kelas' | 'Guru Mapel')[];
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  jabatan?: string | null;
  alamat?: string | null;
  sapaan?: 'Ustad' | 'Ustadzah' | '' | null;
  email: string;
  telepon: string;
  status: 'Aktif' | 'Cuti';
}

export const defaultGuruData: GuruItem[] = [];
