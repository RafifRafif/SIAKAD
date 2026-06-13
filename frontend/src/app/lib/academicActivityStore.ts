import { apiGet } from './apiClient';

export interface StudentGradeItem {
  id: number;
  nis: string;
  nama: string;
  kelas: string;
  tahunAjaran?: string;
  mapel: string;
  jenis: string;
  nilai: number;
  grade: string;
  guru?: string | null;
  tanggal?: string | null;
}

export interface AttendanceRecordItem {
  id: number;
  nis: string;
  nama: string;
  kelas: string;
  tahunAjaran?: string;
  mapel?: string | null;
  tanggal?: string | null;
  hari?: string | null;
  status: string;
  statusCode: 'H' | 'A' | 'S' | 'I' | '-';
  waktu?: string | null;
  keterangan?: string | null;
  guru?: string | null;
}

export interface QuranSubmissionItem {
  id: number;
  nis: string;
  nama: string;
  kelas?: string | null;
  tanggal?: string | null;
  surah: string;
  ayatMulai: number;
  ayatSelesai: number;
  penilaian: string;
  nilai?: string;
  keterangan?: string | null;
  fotoSetoran?: string | null;
  progress: number;
  guru?: string | null;
}

export interface LearningAssignmentItem {
  id: number;
  nama: string;
  tahunAjaran: string;
  guruPengampu: string;
  kelas: string;
  kelompok: 'Ikhwan' | 'Akhwat';
}

export interface DashboardSummary {
  admin: {
    totalSiswa: number;
    totalGuru: number;
    presensiHariIni: number | null;
    rataRataNilai: number | null;
  };
  guru: {
    inputNilai: number;
    presensi: number;
    setoranQuran: number;
    hariEfektif?: number;
  };
  siswa: {
    nilaiTerbaru: StudentGradeItem[];
    presensiTerbaru: AttendanceRecordItem[];
    quranTerbaru: QuranSubmissionItem[];
  };
}

export const emptyDashboardSummary: DashboardSummary = {
  admin: {
    totalSiswa: 0,
    totalGuru: 0,
    presensiHariIni: null,
    rataRataNilai: null,
  },
  guru: {
    inputNilai: 0,
    presensi: 0,
    setoranQuran: 0,
  },
  siswa: {
    nilaiTerbaru: [],
    presensiTerbaru: [],
    quranTerbaru: [],
  },
};

const toQueryString = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const getGrades = (params: Record<string, string | undefined> = {}) =>
  apiGet<StudentGradeItem[]>(`/api/grades${toQueryString(params)}`);

export const getAttendanceRecords = (
  params: Record<string, string | undefined> = {}
) => apiGet<AttendanceRecordItem[]>(`/api/attendance-records${toQueryString(params)}`);

export const getQuranSubmissions = (
  params: Record<string, string | undefined> = {}
) => apiGet<QuranSubmissionItem[]>(`/api/quran-submissions${toQueryString(params)}`);

export const getDashboardSummary = () =>
  apiGet<DashboardSummary>('/api/dashboard-summary');

export interface StudentNoteItem {
  id: number;
  nis: string;
  guru?: string | null;
  tanggal?: string | null;
  catatan: string;
}

export interface StudentAchievementItem {
  id: number;
  nis: string;
  judul: string;
  keterangan?: string | null;
  tanggal?: string | null;
}

export interface StudentInsights {
  rank: number | null;
  classSize: number;
  notes: StudentNoteItem[];
  achievements: StudentAchievementItem[];
}

export interface ClassAgendaItem {
  id: number;
  kelas?: string | null;
  tanggal?: string | null;
  judul: string;
  deskripsi?: string | null;
}

export interface ClassReminderItem {
  id: number;
  kelas?: string | null;
  tanggal?: string | null;
  judul: string;
  deskripsi?: string | null;
  status: string;
}

export interface ClassDashboardData {
  kelas?: string | null;
  totalStudents?: number;
  attendanceToday?: number;
  agendaToday: ClassAgendaItem[];
  reminders: ClassReminderItem[];
  weeklyActivities: number;
  followUps: number;
}

export interface LearningTaskItem {
  id: number;
  learningAssignmentId?: number | null;
  judul: string;
  deskripsi?: string | null;
  kelas?: string | null;
  mapel?: string | null;
  guru?: string | null;
  tanggal?: string | null;
  status: string;
}

export interface ReportOptions {
  bulan: string[];
  kelas: string[];
}

export const getDashboardSummaryWithFilters = (
  params: Record<string, string | undefined> = {}
) => apiGet<DashboardSummary>(`/api/dashboard-summary${toQueryString(params)}`);

export const getStudentInsights = (params: Record<string, string | undefined> = {}) =>
  apiGet<StudentInsights>(`/api/student-insights${toQueryString(params)}`);

export const getClassDashboard = (params: Record<string, string | undefined> = {}) =>
  apiGet<ClassDashboardData>(`/api/class-dashboard${toQueryString(params)}`);

export const getLearningTasks = (params: Record<string, string | undefined> = {}) =>
  apiGet<LearningTaskItem[]>(`/api/learning-tasks${toQueryString(params)}`);

export const getTodaySchedule = () =>
  apiGet<LearningAssignmentItem[]>('/api/schedule/today');

export const getReportOptions = () =>
  apiGet<ReportOptions>('/api/report-options');

export const formatDisplayDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const monthLabelFromDate = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const uniqueValues = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));
