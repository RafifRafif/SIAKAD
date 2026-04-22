'use client';

import { apiRequest } from './api';
import { getAuthState, type AuthRole } from './auth';

export interface BackendAcademicYear {
  id: number;
  name: string;
  semester: 'Ganjil' | 'Genap';
  is_active?: boolean;
}

export interface BackendSchoolClass {
  id: number;
  name: string;
  level: 'X' | 'XI' | 'XII';
  academic_year_id?: number | null;
  academic_year?: BackendAcademicYear | null;
  student_count?: number;
}

export interface BackendTeacherSubject {
  id: number;
  name: string;
  teacher_id?: number | null;
  class_id?: number | null;
  group_type?: 'Ikhwan' | 'Akhwat' | null;
  academic_year_id?: number | null;
  academic_year?: BackendAcademicYear | null;
  school_class?: BackendSchoolClass | null;
}

export interface BackendTeacherProfile {
  id: number;
  nip: string;
  name: string;
  roles?: string[];
  academic_year?: BackendAcademicYear | null;
  subjects?: BackendTeacherSubject[];
  homeroom_classes?: BackendSchoolClass[];
}

export interface BackendAuthProfile {
  username: string;
  role: AuthRole;
  student?: {
    id: number;
    nis: string;
    name: string;
    class?: BackendSchoolClass | null;
    academic_year?: BackendAcademicYear | null;
  } | null;
  teacher?: BackendTeacherProfile | null;
  dashboard_context?: {
    homeroom_classes?: BackendSchoolClass[];
    subject_count?: number;
  };
}

export interface BackendStudent {
  id: number;
  user_id?: number | null;
  academic_year_id?: number | null;
  class_id?: number | null;
  nis: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  email?: string | null;
  phone?: string | null;
  academic_year?: BackendAcademicYear | null;
  class?: BackendSchoolClass | null;
}

export interface BackendAttendanceRecord {
  id: number;
  academic_year_id?: number | null;
  class_id?: number | null;
  subject_id?: number | null;
  teacher_id?: number | null;
  student_id: number;
  attendance_date: string;
  status: 'Hadir' | 'Tidak Hadir' | 'Izin' | 'Sakit';
  notes?: string | null;
  class?: BackendSchoolClass | null;
  subject?: BackendTeacherSubject | null;
  student?: BackendStudent | null;
}

export interface BackendGradeEntry {
  id: number;
  academic_year_id?: number | null;
  subject_id: number;
  teacher_id?: number | null;
  student_id: number;
  assessment_type: 'UTS' | 'UAS' | 'Tugas' | 'Quiz';
  score: number;
  entry_date: string;
  notes?: string | null;
  subject?: BackendTeacherSubject | null;
  student?: BackendStudent | null;
}

export interface BackendQuranDeposit {
  id: number;
  teacher_id?: number | null;
  student_id: number;
  deposit_date: string;
  surah: string;
  verse_start: number;
  verse_end: number;
  assessment: 'Lancar' | 'Kurang Lancar' | 'Perlu Perbaikan';
  notes?: string | null;
  student?: BackendStudent | null;
}

export async function getCurrentAuthProfile(): Promise<BackendAuthProfile | null> {
  const authState = getAuthState();

  if (!authState?.username) {
    return null;
  }

  const response = await apiRequest<{ data: BackendAuthProfile }>(
    `/auth/me?username=${encodeURIComponent(authState.username)}`
  );

  return response.data;
}

export async function getAllStudents(): Promise<BackendStudent[]> {
  const response = await apiRequest<{ data: BackendStudent[] }>('/students');
  return response.data;
}

export async function getAllSubjects(): Promise<BackendTeacherSubject[]> {
  const response = await apiRequest<{ data: BackendTeacherSubject[] }>('/subjects');
  return response.data;
}

export async function getAttendanceRecords(params: {
  teacherId?: number;
  classId?: number;
  subjectId?: number;
  attendanceDate?: string;
}): Promise<BackendAttendanceRecord[]> {
  const query = new URLSearchParams();

  if (params.teacherId) query.set('teacher_id', String(params.teacherId));
  if (params.classId) query.set('class_id', String(params.classId));
  if (params.subjectId) query.set('subject_id', String(params.subjectId));
  if (params.attendanceDate) query.set('attendance_date', params.attendanceDate);

  const response = await apiRequest<{ data: BackendAttendanceRecord[] }>(
    `/attendance-records${query.toString() ? `?${query.toString()}` : ''}`
  );

  return response.data;
}

export async function getGradeEntries(params: {
  teacherId?: number;
  classId?: number;
  subjectId?: number;
  assessmentType?: string;
}): Promise<BackendGradeEntry[]> {
  const query = new URLSearchParams();

  if (params.teacherId) query.set('teacher_id', String(params.teacherId));
  if (params.classId) query.set('class_id', String(params.classId));
  if (params.subjectId) query.set('subject_id', String(params.subjectId));
  if (params.assessmentType) query.set('assessment_type', params.assessmentType);

  const response = await apiRequest<{ data: BackendGradeEntry[] }>(
    `/grade-entries${query.toString() ? `?${query.toString()}` : ''}`
  );

  return response.data;
}

export async function getQuranDeposits(params: {
  teacherId?: number;
  classId?: number;
  studentId?: number;
}): Promise<BackendQuranDeposit[]> {
  const query = new URLSearchParams();

  if (params.teacherId) query.set('teacher_id', String(params.teacherId));
  if (params.classId) query.set('class_id', String(params.classId));
  if (params.studentId) query.set('student_id', String(params.studentId));

  const response = await apiRequest<{ data: BackendQuranDeposit[] }>(
    `/quran-deposits${query.toString() ? `?${query.toString()}` : ''}`
  );

  return response.data;
}

export function getRelevantClassIds(
  profile: BackendAuthProfile | null,
  subjects: BackendTeacherSubject[] = []
): number[] {
  const homeroomClassIds = profile?.dashboard_context?.homeroom_classes?.map((item) => item.id) ?? [];
  const subjectClassIds = subjects
    .map((item) => item.class_id)
    .filter((classId): classId is number => Boolean(classId));

  return Array.from(new Set([...homeroomClassIds, ...subjectClassIds]));
}

export function formatTanggalIndonesia(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}
