<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\QuranSubmission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\Teacher;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AcademicActivityController extends Controller
{
    public function grades(Request $request): JsonResponse
    {
        $query = StudentGrade::query()->orderByDesc('tanggal')->orderByDesc('id');

        if ($request->user()?->hasRole(User::ROLE_SISWA)) {
            $query->where('nis', $request->user()->username);
        } elseif ($request->filled('nis')) {
            $query->where('nis', (string) $request->string('nis'));
        }

        if ($request->filled('kelas')) {
            $query->where('kelas', (string) $request->string('kelas'));
        }

        if ($request->filled('mapel')) {
            $query->where('mapel', (string) $request->string('mapel'));
        }

        if ($request->filled('jenis')) {
            $query->where('jenis_penilaian', (string) $request->string('jenis'));
        }

        if ($request->filled('guru')) {
            $query->where('guru', (string) $request->string('guru'));
        } elseif ($request->boolean('mine')) {
            $teacherName = $this->teacherNameForRequest($request);

            if ($teacherName !== null) {
                $query->where('guru', $teacherName);
            }
        }

        if ($request->filled('bulan') && $request->string('bulan') !== 'Data dari backend') {
            $monthFilter = $this->monthFilterFromLabel((string) $request->string('bulan'));

            if ($monthFilter !== null) {
                $query->whereMonth('tanggal', $monthFilter['month']);

                if ($monthFilter['year'] !== null) {
                    $query->whereYear('tanggal', $monthFilter['year']);
                }
            }
        }

        $this->applyTeacherReadScope($query, $request, 'student_grades');

        return response()->json($query->get()->map->toFrontend()->values());
    }

    public function storeGrade(Request $request): JsonResponse
    {
        $payload = $this->gradePayload($request);
        $status = 201;

        $grade = StudentGrade::query()
            ->where('nis', $payload['nis'])
            ->where('mapel', $payload['mapel'])
            ->where('jenis_penilaian', $payload['jenis_penilaian'])
            ->whereDate('tanggal', $payload['tanggal'])
            ->first();

        if ($grade === null) {
            $grade = StudentGrade::query()->create($payload);
        } else {
            $status = 200;
            $grade->update($payload);
            $grade = $grade->fresh();
        }

        return response()->json($grade->toFrontend(), $status);
    }

    public function updateGrade(Request $request, StudentGrade $studentGrade): JsonResponse
    {
        $studentGrade->update($this->gradePayload($request));

        return response()->json($studentGrade->fresh()->toFrontend());
    }

    public function deleteGrade(StudentGrade $studentGrade): JsonResponse
    {
        $studentGrade->delete();

        return response()->json(['message' => 'Nilai berhasil dihapus.']);
    }

    public function attendanceRecords(Request $request): JsonResponse
    {
        $query = AttendanceRecord::query()->orderByDesc('tanggal')->orderBy('nama');

        if ($request->user()?->hasRole(User::ROLE_SISWA)) {
            $query->where('nis', $request->user()->username);
        } elseif ($request->filled('nis')) {
            $query->where('nis', (string) $request->string('nis'));
        }

        if ($request->filled('kelas')) {
            $query->where('kelas', (string) $request->string('kelas'));
        }

        if ($request->filled('mapel')) {
            $query->where('mapel', (string) $request->string('mapel'));
        }

        if ($request->filled('guru')) {
            $query->where('guru', (string) $request->string('guru'));
        }

        if ($request->filled('bulan')) {
            $monthFilter = $this->monthFilterFromLabel((string) $request->string('bulan'));

            if ($monthFilter !== null) {
                $query->whereMonth('tanggal', $monthFilter['month']);

                if ($monthFilter['year'] !== null) {
                    $query->whereYear('tanggal', $monthFilter['year']);
                }
            }
        }

        $this->applyTeacherReadScope($query, $request, 'attendance_records');

        return response()->json($query->get()->map->toFrontend()->values());
    }

    public function storeAttendanceRecord(Request $request): JsonResponse
    {
        $payload = $this->attendancePayload($request);
        $status = 201;

        $attendanceRecord = AttendanceRecord::query()
            ->where('nis', $payload['nis'])
            ->where('mapel', $payload['mapel'])
            ->whereDate('tanggal', $payload['tanggal'])
            ->first();

        if ($attendanceRecord === null) {
            $attendanceRecord = AttendanceRecord::query()->create($payload);
        } else {
            $status = 200;
            $attendanceRecord->update($payload);
            $attendanceRecord = $attendanceRecord->fresh();
        }

        return response()->json($attendanceRecord->toFrontend(), $status);
    }

    public function updateAttendanceRecord(
        Request $request,
        AttendanceRecord $attendanceRecord,
    ): JsonResponse {
        $attendanceRecord->update($this->attendancePayload($request));

        return response()->json($attendanceRecord->fresh()->toFrontend());
    }

    public function deleteAttendanceRecord(AttendanceRecord $attendanceRecord): JsonResponse
    {
        $attendanceRecord->delete();

        return response()->json(['message' => 'Presensi berhasil dihapus.']);
    }

    public function quranSubmissions(Request $request): JsonResponse
    {
        $query = QuranSubmission::query()->orderByDesc('tanggal')->orderBy('nama');

        if ($request->user()?->hasRole(User::ROLE_SISWA)) {
            $query->where('nis', $request->user()->username);
        } elseif ($request->filled('nis')) {
            $query->where('nis', (string) $request->string('nis'));
        }

        if ($request->filled('kelas')) {
            $query->where('kelas', (string) $request->string('kelas'));
        }

        $this->applyQuranReadScope($query, $request);

        return response()->json($query->get()->map->toFrontend()->values());
    }

    public function storeQuranSubmission(Request $request): JsonResponse
    {
        $payload = $this->quranPayload($request);
        $status = 201;

        $quranSubmission = QuranSubmission::query()
            ->where('nis', $payload['nis'])
            ->whereDate('tanggal', $payload['tanggal'])
            ->where('surah', $payload['surah'])
            ->where('ayat_mulai', $payload['ayat_mulai'])
            ->where('ayat_selesai', $payload['ayat_selesai'])
            ->first();

        if ($quranSubmission === null) {
            $quranSubmission = QuranSubmission::query()->create($payload);
        } else {
            $status = 200;
            $quranSubmission->update($payload);
            $quranSubmission = $quranSubmission->fresh();
        }

        return response()->json($quranSubmission->toFrontend(), $status);
    }

    public function updateQuranSubmission(
        Request $request,
        QuranSubmission $quranSubmission,
    ): JsonResponse {
        $quranSubmission->update($this->quranPayload($request));

        return response()->json($quranSubmission->fresh()->toFrontend());
    }

    public function deleteQuranSubmission(QuranSubmission $quranSubmission): JsonResponse
    {
        $quranSubmission->delete();

        return response()->json(['message' => 'Setoran Qur\'an berhasil dihapus.']);
    }

    public function dashboardSummary(Request $request): JsonResponse
    {
        $today = now()->toDateString();
        $attendanceBase = AttendanceRecord::query();
        $gradeBase = StudentGrade::query();
        $quranBase = QuranSubmission::query();

        $this->applySummaryFilters($attendanceBase, $request);
        $this->applySummaryFilters($gradeBase, $request);
        $this->applyTeacherReadScope($attendanceBase, $request, 'attendance_records');
        $this->applyTeacherReadScope($gradeBase, $request, 'student_grades');
        $this->applyQuranReadScope($quranBase, $request);

        $attendanceToday = (clone $attendanceBase)->whereDate('tanggal', $today);
        $attendanceTotal = (clone $attendanceToday)->count();
        $attendancePresent = (clone $attendanceToday)
            ->whereIn('status', ['hadir', 'Hadir'])
            ->count();
        $averageGrade = (clone $gradeBase)->avg('nilai');
        $siswaGrades = StudentGrade::query()->latest();
        $siswaAttendance = AttendanceRecord::query()->latest();
        $siswaQuran = QuranSubmission::query()->latest();

        if ($request->user()?->hasRole(User::ROLE_SISWA)) {
            $nis = $request->user()->username;

            $siswaGrades->where('nis', $nis);
            $siswaAttendance->where('nis', $nis);
            $siswaQuran->where('nis', $nis);
        }

        return response()->json([
            'admin' => [
                'totalSiswa' => Student::query()->count(),
                'totalGuru' => Teacher::query()->count(),
                'presensiHariIni' => $attendanceTotal > 0
                    ? round(($attendancePresent / $attendanceTotal) * 100, 1)
                    : null,
                'rataRataNilai' => $averageGrade !== null ? round((float) $averageGrade, 2) : null,
            ],
            'guru' => [
                'inputNilai' => (clone $gradeBase)->count(),
                'presensi' => (clone $attendanceBase)->count(),
                'setoranQuran' => (clone $quranBase)->count(),
                'hariEfektif' => (clone $attendanceBase)->distinct('tanggal')->count('tanggal'),
            ],
            'siswa' => [
                'nilaiTerbaru' => $siswaGrades->take(5)->get()->map->toFrontend()->values(),
                'presensiTerbaru' => $siswaAttendance->take(5)->get()->map->toFrontend()->values(),
                'quranTerbaru' => $siswaQuran->take(5)->get()->map->toFrontend()->values(),
            ],
        ]);
    }

    private function applySummaryFilters($query, Request $request): void
    {
        if ($request->filled('kelas') && $request->string('kelas') !== 'all') {
            $query->where('kelas', (string) $request->string('kelas'));
        }

        if ($request->filled('bulan') && $request->string('bulan') !== 'Data dari backend') {
            $monthFilter = $this->monthFilterFromLabel((string) $request->string('bulan'));

            if ($monthFilter !== null) {
                $query->whereMonth('tanggal', $monthFilter['month']);

                if ($monthFilter['year'] !== null) {
                    $query->whereYear('tanggal', $monthFilter['year']);
                }
            }
        }
    }

    private function applyTeacherReadScope($query, Request $request, string $tableName): void
    {
        /** @var User|null $user */
        $user = $request->user();

        if (
            $user === null ||
            $user->hasRole(User::ROLE_ADMIN) ||
            $user->hasRole(User::ROLE_SISWA)
        ) {
            return;
        }

        $teacherName = $this->teacherNameForRequest($request);

        if ($teacherName === null) {
            $query->whereRaw('1 = 0');

            return;
        }

        if ($request->filled('guru')) {
            $query->where('guru', $teacherName);

            return;
        }

        if ($user->hasRole(User::ROLE_WALI_KELAS)) {
            $classNames = $this->waliClassNamesForTeacher($teacherName);

            if ($classNames === []) {
                $query->whereRaw('1 = 0');

                return;
            }

            $query->whereIn('kelas', $classNames);

            return;
        }

        $this->applyTeacherAssignmentScope($query, $teacherName, $tableName);
    }

    private function applyTeacherAssignmentScope($query, string $teacherName, string $tableName): void
    {
        $query->where(function ($builder) use ($teacherName, $tableName): void {
            $builder
                ->where('guru', $teacherName)
                ->orWhereExists(function ($subQuery) use ($teacherName, $tableName): void {
                    $subQuery
                        ->selectRaw('1')
                        ->from('learning_assignments')
                        ->whereColumn('learning_assignments.nama', $tableName.'.mapel')
                        ->whereColumn('learning_assignments.kelas', $tableName.'.kelas')
                        ->where('learning_assignments.guru_pengampu', $teacherName)
                        ->where(function ($yearQuery) use ($tableName): void {
                            $yearQuery
                                ->whereColumn('learning_assignments.tahun_ajaran', $tableName.'.tahun_ajaran')
                                ->orWhereNull($tableName.'.tahun_ajaran')
                                ->orWhere($tableName.'.tahun_ajaran', '');
                        });
                });
        });
    }

    private function applyQuranReadScope($query, Request $request): void
    {
        /** @var User|null $user */
        $user = $request->user();

        if (
            $user === null ||
            $user->hasRole(User::ROLE_ADMIN) ||
            $user->hasRole(User::ROLE_SISWA)
        ) {
            return;
        }

        $teacherName = $this->teacherNameForRequest($request);

        if ($teacherName === null) {
            $query->whereRaw('1 = 0');

            return;
        }

        if ($user->hasRole(User::ROLE_WALI_KELAS)) {
            $classNames = $this->waliClassNamesForTeacher($teacherName);

            if ($classNames === []) {
                $query->whereRaw('1 = 0');

                return;
            }

            $query->whereIn('kelas', $classNames);

            return;
        }

        $query->where('guru', $teacherName);
    }

    /**
     * @return list<string>
     */
    private function waliClassNamesForTeacher(string $teacherName): array
    {
        return SchoolClass::query()
            ->where('wali_kelas', $teacherName)
            ->pluck('nama')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function gradePayload(Request $request): array
    {
        $data = $request->validate([
            'nis' => ['required', 'string', 'max:255'],
            'nama' => ['nullable', 'string', 'max:255'],
            'kelas' => ['nullable', 'string', 'max:255'],
            'tahunAjaran' => ['nullable', 'string', 'max:255'],
            'mapel' => ['required', 'string', 'max:255'],
            'jenis' => ['required', 'string', 'max:255'],
            'nilai' => ['required', 'integer', 'min:0', 'max:100'],
            'guru' => ['nullable', 'string', 'max:255'],
            'tanggal' => ['nullable', 'date'],
        ]);

        $student = Student::query()->where('nis', $data['nis'])->first();

        return [
            'student_id' => $student?->id,
            'nis' => $data['nis'],
            'nama' => $data['nama'] ?? $student?->nama ?? '',
            'kelas' => $data['kelas'] ?? $student?->kelas ?? '',
            'tahun_ajaran' => $data['tahunAjaran'] ?? $student?->tahun_ajaran ?? '',
            'mapel' => $data['mapel'],
            'jenis_penilaian' => $data['jenis'],
            'nilai' => $data['nilai'],
            'guru' => $data['guru'] ?? $this->teacherNameForRequest($request),
            'tanggal' => $data['tanggal'] ?? now()->toDateString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function attendancePayload(Request $request): array
    {
        $data = $request->validate([
            'nis' => ['required', 'string', 'max:255'],
            'nama' => ['nullable', 'string', 'max:255'],
            'kelas' => ['nullable', 'string', 'max:255'],
            'tahunAjaran' => ['nullable', 'string', 'max:255'],
            'mapel' => ['nullable', 'string', 'max:255'],
            'tanggal' => ['required', 'date'],
            'hari' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['hadir', 'alpha', 'sakit', 'izin', 'Hadir', 'Alpha', 'Sakit', 'Izin', 'Tidak Hadir'])],
            'waktu' => ['nullable', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
            'guru' => ['nullable', 'string', 'max:255'],
        ]);

        $student = Student::query()->where('nis', $data['nis'])->first();
        $tanggal = Carbon::parse($data['tanggal']);

        return [
            'student_id' => $student?->id,
            'nis' => $data['nis'],
            'nama' => $data['nama'] ?? $student?->nama ?? '',
            'kelas' => $data['kelas'] ?? $student?->kelas ?? '',
            'tahun_ajaran' => $data['tahunAjaran'] ?? $student?->tahun_ajaran ?? '',
            'mapel' => $data['mapel'] ?? null,
            'tanggal' => $tanggal->toDateString(),
            'hari' => $data['hari'] ?? $tanggal->locale('id')->dayName,
            'status' => $data['status'],
            'waktu' => $data['waktu'] ?? null,
            'keterangan' => $data['keterangan'] ?? null,
            'guru' => $data['guru'] ?? $this->teacherNameForRequest($request),
        ];
    }

    private function teacherNameForRequest(Request $request): ?string
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user === null || ! $user->hasAnyRole([User::ROLE_GURU_MAPEL, User::ROLE_WALI_KELAS])) {
            return null;
        }

        return Teacher::query()->where('nip', $user->username)->value('nama')
            ?? $user->name;
    }

    /**
     * @return array{month: int, year: int|null}|null
     */
    private function monthFilterFromLabel(string $label): ?array
    {
        $label = trim($label);

        if ($label === '') {
            return null;
        }

        $year = preg_match('/\b(19\d{2}|20\d{2})\b/', $label, $yearMatch)
            ? (int) $yearMatch[1]
            : null;

        if (preg_match('/^\d{4}-(0?[1-9]|1[0-2])/', $label, $monthMatch)) {
            return ['month' => (int) $monthMatch[1], 'year' => $year];
        }

        if (preg_match('/^(0?[1-9]|1[0-2])$/', $label, $monthMatch)) {
            return ['month' => (int) $monthMatch[1], 'year' => null];
        }

        $monthNames = [
            'januari' => 1,
            'jan' => 1,
            'februari' => 2,
            'feb' => 2,
            'maret' => 3,
            'mar' => 3,
            'april' => 4,
            'apr' => 4,
            'mei' => 5,
            'may' => 5,
            'juni' => 6,
            'jun' => 6,
            'juli' => 7,
            'jul' => 7,
            'agustus' => 8,
            'agu' => 8,
            'august' => 8,
            'aug' => 8,
            'september' => 9,
            'sep' => 9,
            'oktober' => 10,
            'okt' => 10,
            'october' => 10,
            'oct' => 10,
            'november' => 11,
            'nov' => 11,
            'desember' => 12,
            'des' => 12,
            'december' => 12,
            'dec' => 12,
        ];

        $normalized = strtolower($label);

        foreach ($monthNames as $monthName => $monthNumber) {
            if (str_contains($normalized, $monthName)) {
                return ['month' => $monthNumber, 'year' => $year];
            }
        }

        try {
            $date = Carbon::parse($label);

            return ['month' => $date->month, 'year' => $year ?? $date->year];
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function quranPayload(Request $request): array
    {
        $data = $request->validate([
            'nis' => ['required', 'string', 'max:255'],
            'nama' => ['nullable', 'string', 'max:255'],
            'kelas' => ['nullable', 'string', 'max:255'],
            'tanggal' => ['required', 'date'],
            'surah' => ['required', 'string', 'max:255'],
            'ayatMulai' => ['required', 'integer', 'min:1'],
            'ayatSelesai' => ['required', 'integer', 'min:1', 'gte:ayatMulai'],
            'penilaian' => ['required', Rule::in(['Lancar', 'Kurang Lancar', 'Perlu Perbaikan'])],
            'keterangan' => ['nullable', 'string'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:30'],
            'guru' => ['nullable', 'string', 'max:255'],
        ]);

        $student = Student::query()->where('nis', $data['nis'])->first();
        $guru = isset($data['guru']) ? trim($data['guru']) : null;

        return [
            'student_id' => $student?->id,
            'nis' => trim($data['nis']),
            'nama' => isset($data['nama']) ? trim($data['nama']) : ($student?->nama ?? ''),
            'kelas' => isset($data['kelas']) ? trim($data['kelas']) : $student?->kelas,
            'tanggal' => $data['tanggal'],
            'surah' => trim($data['surah']),
            'ayat_mulai' => $data['ayatMulai'],
            'ayat_selesai' => $data['ayatSelesai'],
            'penilaian' => $data['penilaian'],
            'keterangan' => $data['keterangan'] ?? null,
            'progress_juz' => $data['progress'] ?? 0,
            'guru' => $guru !== '' && $guru !== null ? $guru : $this->teacherNameForRequest($request),
        ];
    }
}
