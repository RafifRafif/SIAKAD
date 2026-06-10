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

export const defaultBobotPenilaian: BobotPenilaianItem[] = [
  {
    id: 'quiz',
    jenisPenilaian: 'Quiz',
    bobot: 20,
  },
  {
    id: 'tugas',
    jenisPenilaian: 'Tugas',
    bobot: 30,
  },
  {
    id: 'uts',
    jenisPenilaian: 'UTS',
    bobot: 25,
  },
  {
    id: 'uas',
    jenisPenilaian: 'UAS',
    bobot: 25,
  },
];

export const defaultGradeRanges: GradeRangeItem[] = [
  {
    id: 'grade-a',
    grade: 'A',
    nilaiMinimum: 90,
    nilaiMaksimum: 100,
  },
  {
    id: 'grade-b',
    grade: 'B',
    nilaiMinimum: 80,
    nilaiMaksimum: 89,
  },
  {
    id: 'grade-c',
    grade: 'C',
    nilaiMinimum: 70,
    nilaiMaksimum: 79,
  },
  {
    id: 'grade-d',
    grade: 'D',
    nilaiMinimum: 60,
    nilaiMaksimum: 69,
  },
  {
    id: 'grade-e',
    grade: 'E',
    nilaiMinimum: 0,
    nilaiMaksimum: 59,
  },
];

export const defaultBobotPenilaianConfig: BobotPenilaianConfig = {
  bobot: defaultBobotPenilaian,
  gradeRanges: defaultGradeRanges,
};

export const getGradeLabel = (
  nilai: number,
  gradeRanges: GradeRangeItem[] = defaultGradeRanges
) => {
  if (Number.isNaN(nilai)) {
    return '-';
  }

  if (gradeRanges.length === 0) {
    if (nilai >= 90) return 'A';
    if (nilai >= 80) return 'B';
    if (nilai >= 70) return 'C';
    if (nilai >= 60) return 'D';
    return 'E';
  }

  const normalizedRanges = [...gradeRanges].sort((a, b) => b.nilaiMinimum - a.nilaiMinimum);
  const matchedRange = normalizedRanges.find(
    (range) => nilai >= range.nilaiMinimum && nilai <= range.nilaiMaksimum
  );

  return matchedRange?.grade ?? '-';
};
