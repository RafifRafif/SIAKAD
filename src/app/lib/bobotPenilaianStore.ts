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

export const getGradeLabel = (
  nilai: number,
  gradeRanges: GradeRangeItem[]
) => {
  const normalizedRanges = [...gradeRanges].sort((a, b) => b.nilaiMinimum - a.nilaiMinimum);
  const matchedRange = normalizedRanges.find(
    (range) => nilai >= range.nilaiMinimum && nilai <= range.nilaiMaksimum
  );

  return matchedRange?.grade ?? '-';
};
