'use client';

export type JenisPenilaian = 'Quiz' | 'Tugas' | 'UTS' | 'UAS';

export interface BobotPenilaianItem {
  id: string;
  jenisPenilaian: JenisPenilaian;
  bobot: number;
}

export interface GradeRangeItem {
  id: string;
  grade: string;
  nilaiMinimum: number;
  nilaiMaksimum: number;
}

export interface BobotPenilaianConfig {
  bobot: BobotPenilaianItem[];
  gradeRanges: GradeRangeItem[];
}

export const BOBOT_PENILAIAN_STORAGE_KEY = 'pbl4-bobot-penilaian';

export const defaultBobotPenilaian: BobotPenilaianItem[] = [
  { id: 'quiz', jenisPenilaian: 'Quiz', bobot: 10 },
  { id: 'tugas', jenisPenilaian: 'Tugas', bobot: 20 },
  { id: 'uts', jenisPenilaian: 'UTS', bobot: 30 },
  { id: 'uas', jenisPenilaian: 'UAS', bobot: 40 },
];

export const defaultGradeRanges: GradeRangeItem[] = [
  { id: 'A', grade: 'A', nilaiMinimum: 90, nilaiMaksimum: 100 },
  { id: 'B', grade: 'B', nilaiMinimum: 80, nilaiMaksimum: 89 },
  { id: 'C', grade: 'C', nilaiMinimum: 70, nilaiMaksimum: 79 },
  { id: 'D', grade: 'D', nilaiMinimum: 60, nilaiMaksimum: 69 },
  { id: 'E', grade: 'E', nilaiMinimum: 0, nilaiMaksimum: 59 },
];

export const defaultBobotPenilaianConfig: BobotPenilaianConfig = {
  bobot: defaultBobotPenilaian,
  gradeRanges: defaultGradeRanges,
};

export const getGradeLabel = (
  nilai: number,
  gradeRanges: GradeRangeItem[] = defaultGradeRanges
) => {
  const normalizedRanges = [...gradeRanges].sort((a, b) => b.nilaiMinimum - a.nilaiMinimum);
  const matchedRange = normalizedRanges.find(
    (range) => nilai >= range.nilaiMinimum && nilai <= range.nilaiMaksimum
  );

  return matchedRange?.grade ?? '-';
};
