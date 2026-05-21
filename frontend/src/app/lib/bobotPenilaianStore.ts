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

export const defaultBobotPenilaian: BobotPenilaianItem[] = [];

export const defaultGradeRanges: GradeRangeItem[] = [];

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
