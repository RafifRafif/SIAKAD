<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\AttendanceRecord;
use App\Models\ClassAgenda;
use App\Models\ClassReminder;
use App\Models\LearningAssignment;
use App\Models\LearningTask;
use App\Models\QuranSubmission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentAchievement;
use App\Models\StudentGrade;
use App\Models\StudentNote;
use App\Models\Teacher;
use App\Models\User;
use App\Models\UserProfile;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use ZipArchive;

class FrontendFeatureController extends Controller
{
    private ?AcademicYear $activeAcademicYearCache = null;

    private bool $activeAcademicYearLoaded = false;

    public function profile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json($this->profilePayload($user, $request));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'studentId' => ['nullable', 'integer'],
            'teacherId' => ['nullable', 'integer'],
            'nama' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'telepon' => ['nullable', 'string', 'max:255'],
            'alamat' => ['nullable', 'string'],
            'tanggalLahir' => ['nullable', 'date'],
            'nuptk' => ['nullable', 'string', 'max:255', 'regex:/^[0-9]+$/'],
            'nisn' => ['nullable', 'string', 'max:255', 'regex:/^[0-9]+$/'],
            'nik' => ['nullable', 'string', 'max:255', 'regex:/^[0-9]+$/'],
            'tahunAjaran' => ['nullable', 'string', 'max:255'],
            'kelas' => ['nullable', 'string', 'max:255'],
            'waliKelas' => ['nullable', 'string', 'max:255'],
            'asalSekolah' => ['nullable', 'string', 'max:255'],
            'namaOrangTua' => ['nullable', 'string', 'max:255'],
            'jenisKelamin' => ['nullable', 'string', 'max:255'],
            'tempatLahir' => ['nullable', 'string', 'max:255'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'sapaan' => ['nullable', Rule::in(['Ustad', 'Ustadzah', ''])],
            'status' => ['nullable', Rule::in(['Aktif', 'Cuti'])],
        ]);

        DB::transaction(function () use ($user, $data): void {
            $user->fill([
                'name' => trim($data['nama']),
                'email' => $data['email'] ? trim($data['email']) : $user->email,
            ])->save();

            UserProfile::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'telepon' => isset($data['telepon']) ? trim($data['telepon']) : null,
                    'alamat' => isset($data['alamat']) ? trim($data['alamat']) : null,
                    'tanggal_lahir' => $data['tanggalLahir'] ?? null,
                ],
            );

            $this->syncLinkedProfileData($user, $data);
        });

        return response()->json($this->profilePayload($user->fresh(), $request));
    }

    public function updateProfilePhoto(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'fotoProfil' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        /** @var UploadedFile $file */
        $file = $data['fotoProfil'];
        $mimeType = $file->getMimeType() ?: 'image/jpeg';
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (! in_array($mimeType, $allowedMimeTypes, true)) {
            throw ValidationException::withMessages([
                'fotoProfil' => 'Foto profile harus berupa JPG, PNG, atau WEBP.',
            ]);
        }

        $content = file_get_contents($file->getRealPath());

        if ($content === false) {
            throw ValidationException::withMessages([
                'fotoProfil' => 'Foto profile tidak dapat dibaca.',
            ]);
        }

        $profile = UserProfile::query()->firstOrNew(['user_id' => $user->id]);
        $profile->profile_photo = 'data:'.$mimeType.';base64,'.base64_encode($content);
        $profile->save();

        return response()->json($this->profilePayload($user->fresh(), $request));
    }

    public function showProfilePhoto(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $profile = UserProfile::query()->where('user_id', $user->id)->first();
        $photo = $this->decodeProfilePhoto($profile?->profile_photo);

        if ($photo === null) {
            abort(404);
        }

        return response($photo['content'], 200)
            ->header('Content-Type', $photo['mimeType'])
            ->header('Cache-Control', 'private, max-age=31536000, immutable');
    }

    public function updatePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:8'],
            'confirmPassword' => ['required', 'string'],
        ]);

        if (! Hash::check($data['currentPassword'], $user->password)) {
            throw ValidationException::withMessages([
                'currentPassword' => 'Password lama tidak sesuai.',
            ]);
        }

        if ($data['newPassword'] !== $data['confirmPassword']) {
            throw ValidationException::withMessages([
                'confirmPassword' => 'Konfirmasi password tidak cocok.',
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($data['newPassword']),
        ])->save();

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ]);
    }

    public function importStudents(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:5120'],
        ]);

        /** @var UploadedFile $file */
        $file = $data['file'];
        $rows = $this->rowsFromUploadedFile($file);
        $imported = 0;
        $importedStudents = [];
        $skipped = [];

        foreach ($rows as $index => $row) {
            $nis = trim((string) ($row['nis'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));
            $tahunAjaran = trim((string) ($row['tahunAjaran'] ?? ''));
            $kelas = trim((string) ($row['kelas'] ?? ''));

            if ($nis === '' || $nama === '' || $tahunAjaran === '' || $kelas === '') {
                $skipped[] = [
                    'row' => $index + 2,
                    'message' => 'NIS, nama, tahun ajaran, dan kelas wajib diisi.',
                ];
                continue;
            }

            $student = Student::query()->updateOrCreate(
                ['nis' => $nis],
                [
                    'nisn' => $row['nisn'] ?: null,
                    'nik' => $row['nik'] ?: null,
                    'nama' => $nama,
                    'tahun_ajaran' => $tahunAjaran,
                    'kelas' => $kelas,
                    'wali_kelas' => $row['waliKelas'] ?: null,
                    'asal_sekolah' => $row['asalSekolah'] ?: null,
                    'nama_orang_tua' => $row['namaOrangTua'] ?: null,
                    'jenis_kelamin' => $row['jenisKelamin'] ?: 'Laki-laki',
                    'tempat_lahir' => $row['tempatLahir'] ?: null,
                    'tanggal_lahir' => $row['tanggalLahir'] ?: null,
                    'alamat' => $row['alamat'] ?: null,
                    'email' => $row['email'] ?: null,
                    'telepon' => $row['telepon'] ?: null,
                ],
            );

            $this->syncImportedStudentUser($student);
            $this->refreshSchoolClassStudentCount($kelas);
            $importedStudents[] = $student->fresh()->toFrontend();
            $imported++;
        }

        return response()->json([
            'message' => 'Import data siswa selesai.',
            'imported' => $imported,
            'skipped' => $skipped,
            'importedStudents' => $importedStudents,
            'students' => Student::query()->orderBy('id')->get()->map->toFrontend()->values(),
        ]);
    }

    public function importTeachers(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:5120'],
        ]);

        /** @var UploadedFile $file */
        $file = $data['file'];
        $rows = $this->rowsFromUploadedFile($file);
        $imported = 0;
        $skipped = [];

        foreach ($rows as $index => $row) {
            $nip = trim((string) ($row['nip'] ?? ''));
            $nama = trim((string) ($row['nama'] ?? ''));
            $tahunAjaran = trim((string) ($row['tahunAjaran'] ?? ''));
            $roles = $this->teacherRolesFromImport((string) ($row['role'] ?? ''));

            if ($nip === '' || $nama === '' || $tahunAjaran === '' || $roles === []) {
                $skipped[] = [
                    'row' => $index + 2,
                    'message' => 'NIP, nama, tahun ajaran, dan role wajib diisi.',
                ];
                continue;
            }

            $teacher = Teacher::query()->updateOrCreate(
                ['nip' => $nip],
                [
                    'nuptk' => $row['nuptk'] ?: null,
                    'nik' => $row['nik'] ?: null,
                    'nama' => $nama,
                    'tahun_ajaran' => $tahunAjaran,
                    'roles' => $roles,
                    'tempat_lahir' => $row['tempatLahir'] ?: null,
                    'tanggal_lahir' => $row['tanggalLahir'] ?: null,
                    'jabatan' => $row['jabatan'] ?: null,
                    'alamat' => $row['alamat'] ?: null,
                    'sapaan' => in_array($row['sapaan'] ?? '', ['Ustad', 'Ustadzah'], true)
                        ? $row['sapaan']
                        : null,
                    'email' => $row['email'] ?: null,
                    'telepon' => $row['telepon'] ?: null,
                    'status' => in_array($row['status'] ?? '', ['Aktif', 'Cuti'], true)
                        ? $row['status']
                        : 'Aktif',
                ],
            );

            $this->syncImportedTeacherUser($teacher);
            $imported++;
        }

        return response()->json([
            'message' => 'Import data guru selesai.',
            'imported' => $imported,
            'skipped' => $skipped,
            'teachers' => Teacher::query()->orderBy('id')->get()->map->toFrontend()->values(),
        ]);
    }

    public function reportOptions(): JsonResponse
    {
        $tahunAjaran = $this->resolvedAcademicYear(request());
        $months = AttendanceRecord::query()
            ->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))
            ->whereNotNull('tanggal')
            ->pluck('tanggal')
            ->merge(
                StudentGrade::query()
                    ->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))
                    ->whereNotNull('tanggal')
                    ->pluck('tanggal')
            )
            ->map(fn ($date) => Carbon::parse($date)->locale('id')->translatedFormat('F Y'))
            ->unique()
            ->values();

        $classes = SchoolClass::query()
            ->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))
            ->pluck('nama')
            ->merge(
                Student::query()
                    ->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))
                    ->pluck('kelas')
            )
            ->filter()
            ->unique()
            ->values();

        return response()->json([
            'bulan' => $months,
            'kelas' => $classes,
        ]);
    }

    public function adminReportExport(Request $request): Response
    {
        $filters = $this->reportFilters($request);
        $attendanceQuery = AttendanceRecord::query();
        $gradeQuery = StudentGrade::query();
        $tahunAjaran = $this->resolvedAcademicYear($request);

        if ($tahunAjaran !== null) {
            $attendanceQuery->where('tahun_ajaran', $tahunAjaran);
            $gradeQuery->where('tahun_ajaran', $tahunAjaran);
        } else {
            $attendanceQuery->whereRaw('1 = 0');
            $gradeQuery->whereRaw('1 = 0');
        }

        $this->applyReportFilters($attendanceQuery, $filters);
        $this->applyReportFilters($gradeQuery, $filters);

        $attendanceTotal = (clone $attendanceQuery)->count();
        $attendancePresent = (clone $attendanceQuery)->whereIn('status', ['hadir', 'Hadir'])->count();
        $averageGrade = (clone $gradeQuery)->avg('nilai');

        $lines = [
            'Laporan Akademik SIAKAD',
            'Periode: '.$filters['periode'],
            'Tahun Ajaran: '.($tahunAjaran ?: 'Tidak ada tahun ajaran aktif'),
            'Bulan: '.($filters['bulan'] ?: 'Semua bulan'),
            'Kelas: '.($filters['kelas'] ?: 'Semua kelas'),
            'Total siswa: '.Student::query()->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))->count(),
            'Total guru: '.Teacher::query()->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))->count(),
            'Total presensi: '.$attendanceTotal,
            'Rata-rata kehadiran: '.($attendanceTotal > 0 ? round(($attendancePresent / $attendanceTotal) * 100, 1).'%' : '0%'),
            'Rata-rata nilai: '.($averageGrade !== null ? round((float) $averageGrade, 2) : '0'),
        ];

        return $this->downloadPdf('laporan-akademik.pdf', 'Laporan Akademik', $lines);
    }

    public function studentReportDownload(Request $request): Response
    {
        $nis = $this->targetNis($request);
        $student = Student::query()->where('nis', $nis)->first();
        $tahunAjaran = (string) $request->string('tahunAjaran', $this->resolvedAcademicYear($request) ?? $student?->tahun_ajaran ?? '');
        $semester = $this->semesterFromTahunAjaran($tahunAjaran);
        $kelas = $student?->kelas ?? '-';
        $waliKelas = $this->studentHomeroomTeacherName($student, $tahunAjaran);
        $grades = StudentGrade::query()
            ->where('nis', $nis)
            ->when($tahunAjaran !== '', fn ($query) => $query->where('tahun_ajaran', $tahunAjaran))
            ->orderBy('mapel')
            ->get();
        $assignments = LearningAssignment::query()
            ->when($tahunAjaran !== '', fn ($query) => $query->where('tahun_ajaran', $tahunAjaran))
            ->when($student?->kelas, fn ($query) => $query->where('kelas', $student->kelas))
            ->orderBy('nama')
            ->get();
        $mapelNames = $assignments->pluck('nama')
            ->merge($grades->pluck('mapel'))
            ->filter()
            ->unique()
            ->sort()
            ->values();
        $rows = $mapelNames->map(function (string $mapel) use ($assignments, $grades): array {
            $assignment = $assignments->firstWhere('nama', $mapel);
            $mapelGrades = $grades->where('mapel', $mapel);
            $average = $mapelGrades->count() > 0 ? round((float) $mapelGrades->avg('nilai'), 2) : null;

            return [
                'mapel' => $mapel,
                'guru' => $assignment?->guru_pengampu ?? $mapelGrades->first()?->guru ?? '-',
                'angka' => $average !== null ? (string) $average : '-',
                'predikat' => $average !== null ? $this->gradeLabelFromAverage($average) : '-',
            ];
        })->values()->all();
        $nilaiTerisi = array_values(array_filter($rows, fn (array $row) => $row['angka'] !== '-'));
        $totalNilai = array_sum(array_map(fn (array $row) => (float) $row['angka'], $nilaiTerisi));
        $rataRata = count($nilaiTerisi) > 0 ? round($totalNilai / count($nilaiTerisi), 2) : null;
        $attendance = AttendanceRecord::query()
            ->where('nis', $nis)
            ->when($tahunAjaran !== '', fn ($query) => $query->where('tahun_ajaran', $tahunAjaran))
            ->get();

        $pdf = $this->studentReportPdf([
            'nis' => $nis,
            'nama' => $student?->nama ?? '-',
            'kelas' => $kelas,
            'tahunAjaran' => $tahunAjaran !== '' ? $tahunAjaran : '-',
            'semester' => $semester,
            'waliKelas' => $waliKelas,
            'rows' => $rows,
            'totalNilai' => count($nilaiTerisi) > 0 ? (string) round($totalNilai, 2) : '-',
            'rataRata' => $rataRata !== null ? (string) $rataRata : '-',
            'sakit' => (string) $attendance->filter(fn (AttendanceRecord $record) => in_array($record->status, ['sakit', 'Sakit'], true))->count(),
            'izin' => (string) $attendance->filter(fn (AttendanceRecord $record) => in_array($record->status, ['izin', 'Izin'], true))->count(),
            'alpha' => (string) $attendance->filter(fn (AttendanceRecord $record) => in_array($record->status, ['alpha', 'Alpha', 'Tidak Hadir'], true))->count(),
        ]);

        $filename = 'RAPORT - '.$this->safeReportFilename($student?->nama ?? $nis).'.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function studentInsights(Request $request): JsonResponse
    {
        $nis = $this->targetNis($request);
        $academicYear = $this->resolvedAcademicYearModel($request);
        $dateRange = $this->academicYearDateRange($academicYear);
        $rank = $this->rankForStudent($nis, $academicYear);

        return response()->json([
            'rank' => $rank['rank'],
            'classSize' => $rank['classSize'],
            'notes' => StudentNote::query()
                ->where('nis', $nis)
                ->when(
                    $dateRange !== null,
                    fn ($query) => $query->whereBetween('tanggal', [$dateRange['start'], $dateRange['end']]),
                    fn ($query) => $query->whereRaw('1 = 0')
                )
                ->orderByDesc('tanggal')
                ->orderByDesc('id')
                ->get()
                ->map->toFrontend()
                ->values(),
            'achievements' => StudentAchievement::query()
                ->where('nis', $nis)
                ->when(
                    $dateRange !== null,
                    fn ($query) => $query->whereBetween('tanggal', [$dateRange['start'], $dateRange['end']]),
                    fn ($query) => $query->whereRaw('1 = 0')
                )
                ->orderByDesc('tanggal')
                ->orderByDesc('id')
                ->get()
                ->map->toFrontend()
                ->values(),
        ]);
    }

    public function classDashboard(Request $request): JsonResponse
    {
        $className = $this->targetClassName($request);
        $today = now()->toDateString();
        $startOfWeek = now()->startOfWeek()->toDateString();
        $endOfWeek = now()->endOfWeek()->toDateString();
        $academicYear = $this->resolvedAcademicYearModel($request);
        $dateRange = $this->academicYearDateRange($academicYear);
        $tahunAjaran = $this->resolvedAcademicYear($request);

        $agendaQuery = ClassAgenda::query();
        $reminderQuery = ClassReminder::query();

        if ($dateRange !== null) {
            $agendaQuery->whereBetween('tanggal', [$dateRange['start'], $dateRange['end']]);
            $reminderQuery->where(function ($query) use ($dateRange): void {
                $query
                    ->whereNull('tanggal')
                    ->orWhereBetween('tanggal', [$dateRange['start'], $dateRange['end']]);
            });
        } else {
            $agendaQuery->whereRaw('1 = 0');
            $reminderQuery->whereRaw('1 = 0');
        }

        if ($className !== null) {
            $agendaQuery->where(fn ($query) => $query->whereNull('kelas')->orWhere('kelas', $className));
            $reminderQuery->where(fn ($query) => $query->whereNull('kelas')->orWhere('kelas', $className));
        }

        $agendaToday = (clone $agendaQuery)
            ->whereDate('tanggal', $today)
            ->orderBy('id')
            ->get()
            ->map->toFrontend()
            ->values();
        $reminders = (clone $reminderQuery)
            ->where('status', '!=', 'selesai')
            ->orderByRaw('tanggal is null')
            ->orderBy('tanggal')
            ->orderBy('id')
            ->get()
            ->map->toFrontend()
            ->values();
        $weeklyActivities = (clone $agendaQuery)
            ->whereBetween('tanggal', [$startOfWeek, $endOfWeek])
            ->count();
        $attendanceFollowUps = AttendanceRecord::query()
            ->when($className, fn ($query) => $query->where('kelas', $className))
            ->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))
            ->whereIn('status', ['alpha', 'Alpha', 'Tidak Hadir'])
            ->whereDate('tanggal', '>=', now()->subDays(7)->toDateString())
            ->count();

        return response()->json([
            'kelas' => $className,
            'totalStudents' => Student::query()
                ->when($className, fn ($query) => $query->where('kelas', $className))
                ->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))
                ->count(),
            'attendanceToday' => AttendanceRecord::query()
                ->when($className, fn ($query) => $query->where('kelas', $className))
                ->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))
                ->whereDate('tanggal', $today)
                ->count(),
            'agendaToday' => $agendaToday,
            'reminders' => $reminders,
            'weeklyActivities' => $weeklyActivities,
            'followUps' => $reminders->count() + $attendanceFollowUps,
        ]);
    }

    public function learningTasks(Request $request): JsonResponse
    {
        $tasks = $this->filteredLearningTasks($request);

        if ($tasks->isNotEmpty()) {
            return response()->json($tasks->map->toFrontend()->values());
        }

        return response()->json($this->derivedTasksFromAssignments($request));
    }

    public function todaySchedule(Request $request): JsonResponse
    {
        $query = LearningAssignment::query()->orderBy('id');
        $tahunAjaran = $this->resolvedAcademicYear($request);

        if ($tahunAjaran !== null) {
            $query->where('tahun_ajaran', $tahunAjaran);
        } else {
            $query->whereRaw('1 = 0');
        }

        if ($request->user()?->hasRole(User::ROLE_SISWA)) {
            $student = Student::query()->where('nis', $request->user()->username)->first();

            if ($student !== null) {
                $query->where('kelas', $student->kelas);
            }
        } elseif ($request->user()?->hasAnyRole([User::ROLE_GURU_MAPEL, User::ROLE_WALI_KELAS])) {
            $teacher = Teacher::query()->where('nip', $request->user()->username)->first();

            if ($teacher !== null) {
                $query->where('guru_pengampu', $teacher->nama);
            }
        }

        return response()->json($query->get()->map->toFrontend()->values());
    }

    /**
     * @return array<string, mixed>
     */
    private function profilePayload(User $user, Request $request): array
    {
        $profile = UserProfile::query()->where('user_id', $user->id)->first();
        $student = Student::query()->where('nis', $user->username)->first();
        $teacher = Teacher::query()->where('nip', $user->username)->first();

        return [
            'studentId' => $student?->id,
            'teacherId' => $teacher?->id,
            'username' => $user->username,
            'role' => $user->frontendRole(),
            'guruAccess' => $user->guruAccess(),
            'nama' => $student?->nama ?? $teacher?->nama ?? $user->name,
            'email' => $student?->email ?? $teacher?->email ?? $user->email,
            'telepon' => $student?->telepon ?? $teacher?->telepon ?? $profile?->telepon,
            'alamat' => $student?->alamat ?? $teacher?->alamat ?? $profile?->alamat,
            'tanggalLahir' => $this->safeDateForFrontend($student?->tanggal_lahir)
                ?? $this->safeDateForFrontend($teacher?->tanggal_lahir)
                ?? $this->safeDateForFrontend($profile?->tanggal_lahir),
            'nuptk' => $teacher?->nuptk,
            'nisn' => $student?->nisn,
            'nik' => $student?->nik ?? $teacher?->nik,
            'tahunAjaran' => $student?->tahun_ajaran ?? $teacher?->tahun_ajaran,
            'kelas' => $student?->kelas,
            'waliKelas' => $student?->wali_kelas,
            'asalSekolah' => $student?->asal_sekolah,
            'namaOrangTua' => $student?->nama_orang_tua,
            'jenisKelamin' => $student?->jenis_kelamin,
            'tempatLahir' => $student?->tempat_lahir ?? $teacher?->tempat_lahir,
            'jabatan' => $teacher?->jabatan,
            'sapaan' => $teacher?->sapaan,
            'status' => $teacher?->status ?? 'Aktif',
            'fotoProfil' => $this->profilePhotoUrl($profile, $request),
        ];
    }

    private function profilePhotoUrl(?UserProfile $profile, Request $request): ?string
    {
        if (! $profile?->profile_photo) {
            return null;
        }

        $version = substr(sha1($profile->profile_photo), 0, 12);

        return '/api/profile/photo-content?v='.$version;
    }

    private function safeDateForFrontend(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        if (is_string($value)) {
            try {
                return Carbon::parse($value)->format('Y-m-d');
            } catch (\Throwable) {
                return trim($value) !== '' ? trim($value) : null;
            }
        }

        return null;
    }

    /**
     * @return array{mimeType: string, content: string}|null
     */
    private function decodeProfilePhoto(?string $profilePhoto): ?array
    {
        if ($profilePhoto === null || $profilePhoto === '') {
            return null;
        }

        if (! preg_match('/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/', $profilePhoto, $matches)) {
            return null;
        }

        $content = base64_decode($matches[2], true);

        if ($content === false) {
            return null;
        }

        return [
            'mimeType' => $matches[1],
            'content' => $content,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncLinkedProfileData(User $user, array $data): void
    {
        $studentId = isset($data['studentId']) ? (int) $data['studentId'] : null;
        $student = Student::query()
            ->when($studentId !== null, fn ($query) => $query->whereKey($studentId))
            ->where('nis', $user->username)
            ->first();

        if ($student !== null) {
            $student->update([
                'nama' => trim($data['nama']),
                'email' => $data['email'] ? trim($data['email']) : null,
                'telepon' => isset($data['telepon']) ? trim($data['telepon']) : null,
                'alamat' => isset($data['alamat']) ? trim($data['alamat']) : null,
                'tanggal_lahir' => $data['tanggalLahir'] ?? null,
                'nisn' => isset($data['nisn']) ? trim($data['nisn']) : null,
                'nik' => isset($data['nik']) ? trim($data['nik']) : null,
                'tahun_ajaran' => isset($data['tahunAjaran']) ? trim($data['tahunAjaran']) : $student->tahun_ajaran,
                'kelas' => isset($data['kelas']) ? trim($data['kelas']) : $student->kelas,
                'wali_kelas' => isset($data['waliKelas']) ? trim($data['waliKelas']) : null,
                'asal_sekolah' => isset($data['asalSekolah']) ? trim($data['asalSekolah']) : null,
                'nama_orang_tua' => isset($data['namaOrangTua']) ? trim($data['namaOrangTua']) : null,
                'jenis_kelamin' => isset($data['jenisKelamin']) ? trim($data['jenisKelamin']) : $student->jenis_kelamin,
                'tempat_lahir' => isset($data['tempatLahir']) ? trim($data['tempatLahir']) : null,
            ]);

            StudentGrade::query()->where('nis', $student->nis)->update(['nama' => trim($data['nama'])]);
            AttendanceRecord::query()->where('nis', $student->nis)->update(['nama' => trim($data['nama'])]);
            QuranSubmission::query()->where('nis', $student->nis)->update(['nama' => trim($data['nama'])]);

            return;
        }

        $teacherId = isset($data['teacherId']) ? (int) $data['teacherId'] : null;
        $teacher = Teacher::query()
            ->when($teacherId !== null, fn ($query) => $query->whereKey($teacherId))
            ->where('nip', $user->username)
            ->first();

        if ($teacher !== null) {
            $previousName = $teacher->nama;
            $teacher->update([
                'nama' => trim($data['nama']),
                'email' => $data['email'] ? trim($data['email']) : null,
                'telepon' => isset($data['telepon']) ? trim($data['telepon']) : null,
                'alamat' => isset($data['alamat']) ? trim($data['alamat']) : null,
                'tanggal_lahir' => $data['tanggalLahir'] ?? null,
                'nuptk' => isset($data['nuptk']) ? trim($data['nuptk']) : null,
                'nik' => isset($data['nik']) ? trim($data['nik']) : null,
                'tahun_ajaran' => isset($data['tahunAjaran']) && trim((string) $data['tahunAjaran']) !== ''
                    ? trim($data['tahunAjaran'])
                    : $teacher->tahun_ajaran,
                'tempat_lahir' => isset($data['tempatLahir']) ? trim($data['tempatLahir']) : null,
                'jabatan' => isset($data['jabatan']) ? trim($data['jabatan']) : null,
                'sapaan' => isset($data['sapaan']) && trim((string) $data['sapaan']) !== ''
                    ? trim($data['sapaan'])
                    : null,
                'status' => isset($data['status']) && trim((string) $data['status']) !== ''
                    ? trim($data['status'])
                    : $teacher->status,
            ]);

            SchoolClass::query()->where('wali_kelas', $previousName)->update(['wali_kelas' => trim($data['nama'])]);
            LearningAssignment::query()->where('guru_pengampu', $previousName)->update(['guru_pengampu' => trim($data['nama'])]);
            StudentGrade::query()->where('guru', $previousName)->update(['guru' => trim($data['nama'])]);
            AttendanceRecord::query()->where('guru', $previousName)->update(['guru' => trim($data['nama'])]);
            QuranSubmission::query()->where('guru', $previousName)->update(['guru' => trim($data['nama'])]);
            LearningTask::query()->where('guru', $previousName)->update(['guru' => trim($data['nama'])]);
        }
    }

    /**
     * @return list<array<string, string>>
     */
    private function rowsFromUploadedFile(UploadedFile $file): array
    {
        try {
            $rows = $this->rawRowsFromUploadedFile($file);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'file' => 'File import tidak dapat dibaca. Pastikan format file adalah XLSX, XLS, atau CSV yang valid.',
            ]);
        }

        if (count($rows) < 2) {
            throw ValidationException::withMessages([
                'file' => 'File import harus memiliki header dan minimal satu baris data.',
            ]);
        }

        $headerRowIndex = $this->importHeaderRowIndex($rows);
        $headers = array_map(
            fn ($header) => $this->normalizeHeader((string) $header),
            $rows[$headerRowIndex]
        );
        $dataRows = [];

        foreach (array_slice($rows, $headerRowIndex + 1) as $row) {
            $mapped = [
                'nis' => '',
                'nisn' => '',
                'nik' => '',
                'nip' => '',
                'nuptk' => '',
                'nama' => '',
                'tahunAjaran' => '',
                'kelas' => '',
                'waliKelas' => '',
                'asalSekolah' => '',
                'namaOrangTua' => '',
                'jenisKelamin' => '',
                'tempatLahir' => '',
                'tanggalLahir' => '',
                'jabatan' => '',
                'sapaan' => '',
                'alamat' => '',
                'role' => '',
                'email' => '',
                'telepon' => '',
                'status' => '',
            ];

            foreach ($row as $index => $value) {
                $field = $this->fieldFromHeader($headers[$index] ?? '');

                if ($field !== null) {
                    $mapped[$field] = $this->normalizeImportedCell($value);
                }
            }

            $mapped['tanggalLahir'] = $this->normalizeImportedDate($mapped['tanggalLahir']);

            if (implode('', $mapped) !== '') {
                $dataRows[] = $mapped;
            }
        }

        return $dataRows;
    }

    /**
     * @param list<list<mixed>> $rows
     */
    private function importHeaderRowIndex(array $rows): int
    {
        foreach ($rows as $index => $row) {
            $fields = array_values(array_filter(array_map(
                fn ($header) => $this->fieldFromHeader($this->normalizeHeader((string) $header)),
                $row
            )));

            if (in_array('nama', $fields, true) && (in_array('nis', $fields, true) || in_array('nip', $fields, true))) {
                return $index;
            }
        }

        throw ValidationException::withMessages([
            'file' => 'File import tidak memiliki header yang valid.',
        ]);
    }

    /**
     * @return list<list<mixed>>
     */
    private function rawRowsFromUploadedFile(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return match ($extension) {
            'csv' => $this->rowsFromCsvFile($file),
            'xlsx' => $this->rowsFromXlsxFile($file),
            default => throw ValidationException::withMessages([
                'file' => 'Format file belum didukung. Gunakan file XLSX atau CSV.',
            ]),
        };
    }

    /**
     * @return list<list<mixed>>
     */
    private function rowsFromCsvFile(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'rb');

        if ($handle === false) {
            throw new \RuntimeException('CSV file cannot be opened.');
        }

        $rows = [];

        try {
            while (($row = fgetcsv($handle)) !== false) {
                $rows[] = array_map(
                    static fn ($value) => is_string($value) ? trim($value) : $value,
                    $row,
                );
            }
        } finally {
            fclose($handle);
        }

        return $rows;
    }

    /**
     * @return list<list<mixed>>
     */
    private function rowsFromXlsxFile(UploadedFile $file): array
    {
        $zip = new ZipArchive();
        $opened = $zip->open($file->getRealPath());

        if ($opened !== true) {
            throw new \RuntimeException('XLSX file cannot be opened.');
        }

        try {
            $sheetPath = $this->firstWorksheetPathFromArchive($zip);
            $sheetXml = $zip->getFromName($sheetPath);

            if ($sheetXml === false) {
                throw new \RuntimeException('Worksheet XML not found.');
            }

            $sharedStrings = $this->sharedStringsFromArchive($zip);

            return $this->rowsFromWorksheetXml($sheetXml, $sharedStrings);
        } finally {
            $zip->close();
        }
    }

    private function firstWorksheetPathFromArchive(ZipArchive $zip): string
    {
        $worksheetPaths = [];

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);

            if (is_string($name) && preg_match('#^xl/worksheets/sheet\d+\.xml$#i', $name)) {
                $worksheetPaths[] = $name;
            }
        }

        if ($worksheetPaths === []) {
            throw new \RuntimeException('Worksheet file not found.');
        }

        natsort($worksheetPaths);

        return array_values($worksheetPaths)[0];
    }

    /**
     * @return list<string>
     */
    private function sharedStringsFromArchive(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');

        if ($xml === false) {
            return [];
        }

        $document = simplexml_load_string($xml);

        if ($document === false) {
            throw new \RuntimeException('Shared strings XML is invalid.');
        }

        $strings = [];

        foreach ($document->xpath('/*[local-name()="sst"]/*[local-name()="si"]') ?: [] as $item) {
            $textNodes = $item->xpath('./*[local-name()="t"]') ?: [];

            if ($textNodes !== []) {
                $strings[] = (string) $textNodes[0];
                continue;
            }

            $parts = [];

            foreach ($item->xpath('./*[local-name()="r"]/*[local-name()="t"]') ?: [] as $textNode) {
                $parts[] = (string) $textNode;
            }

            $strings[] = implode('', $parts);
        }

        return $strings;
    }

    /**
     * @param list<string> $sharedStrings
     * @return list<list<mixed>>
     */
    private function rowsFromWorksheetXml(string $sheetXml, array $sharedStrings): array
    {
        $document = simplexml_load_string($sheetXml);

        if ($document === false) {
            throw new \RuntimeException('Worksheet XML is invalid.');
        }

        $rows = [];

        foreach ($document->xpath('/*[local-name()="worksheet"]/*[local-name()="sheetData"]/*[local-name()="row"]') ?: [] as $rowNode) {
            $row = [];

            foreach ($rowNode->xpath('./*[local-name()="c"]') ?: [] as $cellNode) {
                $reference = (string) ($cellNode['r'] ?? '');
                $columnIndex = $this->xlsxColumnIndexFromReference($reference);

                if ($columnIndex < 0) {
                    continue;
                }

                $row[$columnIndex] = $this->xlsxCellValue($cellNode, $sharedStrings);
            }

            if ($row !== []) {
                ksort($row);
                $maxIndex = max(array_keys($row));
                $normalizedRow = [];

                for ($index = 0; $index <= $maxIndex; $index++) {
                    $normalizedRow[] = $row[$index] ?? '';
                }

                $rows[] = $normalizedRow;
            }
        }

        return $rows;
    }

    private function xlsxColumnIndexFromReference(string $reference): int
    {
        if (! preg_match('/^[A-Z]+/i', $reference, $matches)) {
            return -1;
        }

        $letters = strtoupper($matches[0]);
        $index = 0;

        for ($position = 0; $position < strlen($letters); $position++) {
            $index = ($index * 26) + (ord($letters[$position]) - 64);
        }

        return $index - 1;
    }

    /**
     * @param list<string> $sharedStrings
     */
    private function xlsxCellValue(\SimpleXMLElement $cellNode, array $sharedStrings): mixed
    {
        $type = (string) ($cellNode['t'] ?? '');

        if ($type === 'inlineStr') {
            return trim((string) ($cellNode->is->t ?? ''));
        }

        $value = isset($cellNode->v) ? (string) $cellNode->v : '';

        if ($type === 's') {
            $sharedIndex = (int) $value;

            return $sharedStrings[$sharedIndex] ?? '';
        }

        if ($type === 'b') {
            return $value === '1' ? '1' : '0';
        }

        return trim($value);
    }

    private function normalizeImportedCell(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return trim((string) $value);
    }

    private function normalizeImportedDate(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return '';
        }

        if (is_numeric($value)) {
            $excelDate = (float) $value;

            if ($excelDate > 0) {
                try {
                    return Carbon::createFromTimestampUTC((int) round(($excelDate - 25569) * 86400))
                        ->format('Y-m-d');
                } catch (\Throwable) {
                    return $value;
                }
            }

            return $value;
        }

        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y', 'm/d/Y'] as $format) {
            try {
                $date = Carbon::createFromFormat($format, $value);

                if ($date !== false) {
                    return $date->format('Y-m-d');
                }
            } catch (\Throwable) {
            }
        }

        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable) {
            return $value;
        }
    }

    private function normalizeHeader(string $header): string
    {
        return preg_replace('/[^a-z0-9]/', '', strtolower($header)) ?? '';
    }

    private function fieldFromHeader(string $header): ?string
    {
        return match ($header) {
            'nis', 'nomorinduk', 'nomorinduksiswa' => 'nis',
            'nisn' => 'nisn',
            'nik' => 'nik',
            'nip', 'nomorindukpegawai', 'nomorindukguru' => 'nip',
            'nuptk' => 'nuptk',
            'nama', 'namalengkap', 'namasiswa' => 'nama',
            'tahunajaran', 'tahun' => 'tahunAjaran',
            'kelas', 'class' => 'kelas',
            'walikelas', 'wali' => 'waliKelas',
            'asalsekolah', 'sekolahasal' => 'asalSekolah',
            'namaorangtua', 'orangtua', 'namaortu' => 'namaOrangTua',
            'jeniskelamin', 'jk', 'gender' => 'jenisKelamin',
            'tempatlahir', 'tempat' => 'tempatLahir',
            'tanggallahir', 'tgllahir', 'ttl' => 'tanggalLahir',
            'jabatan', 'position' => 'jabatan',
            'sapaan', 'ustadustadzah', 'ustadzustadzah', 'ustadustadzahguru' => 'sapaan',
            'alamat', 'address' => 'alamat',
            'role', 'roles', 'akses', 'aksesguru' => 'role',
            'email', 'emailaddress', 'surel' => 'email',
            'telepon', 'telp', 'nohp', 'hp', 'phone' => 'telepon',
            'status' => 'status',
            default => null,
        };
    }

    private function syncImportedStudentUser(Student $student): void
    {
        $user = User::query()->firstOrNew(['username' => $student->nis]);
        $user->fill([
            'name' => $student->nama,
            'email' => $this->uniqueImportedUserEmail($student->email, $student->nis, $user->id),
            'roles' => [User::ROLE_SISWA],
            'email_verified_at' => now(),
        ]);

        if (! $user->exists) {
            $user->password = Hash::make($student->nis);
        }

        $user->save();
    }

    /**
     * @return list<string>
     */
    private function teacherRolesFromImport(string $value): array
    {
        $roles = collect(preg_split('/[|,;]/', $value) ?: [])
            ->map(fn ($role) => strtolower(trim($role)))
            ->filter()
            ->flatMap(function (string $role): array {
                return match ($role) {
                    'guru mapel', 'mapel', 'guru mata pelajaran' => ['Guru Mapel'],
                    'wali kelas', 'wali' => ['Wali Kelas'],
                    default => [],
                };
            })
            ->unique()
            ->values()
            ->all();

        return $roles;
    }

    private function syncImportedTeacherUser(Teacher $teacher): void
    {
        $roles = [];

        if (in_array('Guru Mapel', $teacher->roles ?? [], true)) {
            $roles[] = User::ROLE_GURU_MAPEL;
        }

        if (in_array('Wali Kelas', $teacher->roles ?? [], true)) {
            $roles[] = User::ROLE_WALI_KELAS;
        }

        $user = User::query()->firstOrNew(['username' => $teacher->nip]);
        $user->fill([
            'name' => $teacher->nama,
            'email' => $this->uniqueImportedUserEmail($teacher->email, $teacher->nip, $user->id),
            'roles' => $roles,
            'email_verified_at' => now(),
        ]);

        if (! $user->exists) {
            $user->password = Hash::make($teacher->nip);
        }

        $user->save();
    }

    private function uniqueImportedUserEmail(?string $email, string $username, ?int $currentUserId): string
    {
        $candidate = trim((string) $email);

        if ($candidate !== '' && ! $this->emailUsedByAnotherUser($candidate, $currentUserId)) {
            return $candidate;
        }

        $localPart = preg_replace('/[^a-z0-9._-]/', '', strtolower($username)) ?: 'user';
        $fallback = $localPart.'@siakad.local';

        if (! $this->emailUsedByAnotherUser($fallback, $currentUserId)) {
            return $fallback;
        }

        for ($index = 1; $index < 1000; $index++) {
            $fallback = $localPart.'-'.$index.'@siakad.local';

            if (! $this->emailUsedByAnotherUser($fallback, $currentUserId)) {
                return $fallback;
            }
        }

        return uniqid($localPart.'-', true).'@siakad.local';
    }

    private function emailUsedByAnotherUser(string $email, ?int $currentUserId): bool
    {
        return User::query()
            ->where('email', $email)
            ->when($currentUserId, fn ($query) => $query->where('id', '!=', $currentUserId))
            ->exists();
    }

    private function refreshSchoolClassStudentCount(string $className): void
    {
        SchoolClass::query()
            ->where('nama', $className)
            ->get()
            ->each(function (SchoolClass $schoolClass): void {
                $schoolClass->update([
                    'jumlah_siswa' => Student::query()
                        ->where('kelas', $schoolClass->nama)
                        ->where('tahun_ajaran', $schoolClass->tahun_ajaran)
                        ->count(),
                ]);
            });
    }

    private function targetNis(Request $request): string
    {
        if ($request->user()?->hasRole(User::ROLE_SISWA)) {
            return $request->user()->username;
        }

        return (string) $request->string('nis', $request->user()?->username ?? '');
    }

    /**
     * @return array{rank: int|null, classSize: int}
     */
    private function rankForStudent(string $nis, ?AcademicYear $academicYear = null): array
    {
        $student = Student::query()->where('nis', $nis)->first();

        if ($student === null) {
            return ['rank' => null, 'classSize' => 0];
        }

        $tahunAjaran = $academicYear !== null
            ? trim($academicYear->nama.' '.$academicYear->semester)
            : $this->activeAcademicYearValue();

        $averages = StudentGrade::query()
            ->where('kelas', $student->kelas)
            ->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))
            ->selectRaw('nis, avg(nilai) as average_score')
            ->groupBy('nis')
            ->orderByDesc('average_score')
            ->get();

        $rank = null;

        foreach ($averages as $index => $average) {
            if ($average->nis === $nis) {
                $rank = $index + 1;
                break;
            }
        }

        return [
            'rank' => $rank,
            'classSize' => Student::query()
                ->where('kelas', $student->kelas)
                ->when($tahunAjaran !== null, fn ($query) => $query->where('tahun_ajaran', $tahunAjaran), fn ($query) => $query->whereRaw('1 = 0'))
                ->count(),
        ];
    }

    private function targetClassName(Request $request): ?string
    {
        if ($request->filled('kelas') && $request->string('kelas') !== 'all') {
            return (string) $request->string('kelas');
        }

        $teacher = Teacher::query()->where('nip', $request->user()?->username)->first();

        if ($teacher === null) {
            return null;
        }

        return SchoolClass::query()
            ->where('wali_kelas', $teacher->nama)
            ->when(
                $this->activeAcademicYearValue(),
                fn ($query, $tahunAjaran) => $query->where('tahun_ajaran', $tahunAjaran),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->value('nama');
    }

    private function resolvedAcademicYear(Request $request): ?string
    {
        if ($request->filled('tahunAjaran') && $request->string('tahunAjaran') !== 'all') {
            return (string) $request->string('tahunAjaran');
        }

        return $this->activeAcademicYearValue();
    }

    private function resolvedAcademicYearModel(Request $request): ?AcademicYear
    {
        if ($request->filled('tahunAjaran') && $request->string('tahunAjaran') !== 'all') {
            $requestedValue = trim((string) $request->string('tahunAjaran'));

            return AcademicYear::query()
                ->get()
                ->first(fn (AcademicYear $item) => trim($item->nama.' '.$item->semester) === $requestedValue);
        }

        return $this->activeAcademicYear();
    }

    private function activeAcademicYear(): ?AcademicYear
    {
        if (! $this->activeAcademicYearLoaded) {
            $this->activeAcademicYearCache = AcademicYear::query()
                ->where('status', 'Aktif')
                ->latest('id')
                ->first();
            $this->activeAcademicYearLoaded = true;
        }

        return $this->activeAcademicYearCache;
    }

    private function activeAcademicYearValue(): ?string
    {
        $academicYear = $this->activeAcademicYear();

        if ($academicYear === null) {
            return null;
        }

        return trim($academicYear->nama.' '.$academicYear->semester);
    }

    /**
     * @return array{start: string, end: string}|null
     */
    private function academicYearDateRange(?AcademicYear $academicYear): ?array
    {
        if (
            $academicYear === null ||
            $academicYear->tanggal_mulai === null ||
            $academicYear->tanggal_selesai === null
        ) {
            return null;
        }

        return [
            'start' => $academicYear->tanggal_mulai->format('Y-m-d'),
            'end' => $academicYear->tanggal_selesai->format('Y-m-d'),
        ];
    }

    private function filteredLearningTasks(Request $request)
    {
        $query = LearningTask::query()->orderByDesc('tanggal')->orderByDesc('id');
        $dateRange = $this->academicYearDateRange($this->resolvedAcademicYearModel($request));

        if ($dateRange !== null) {
            $query->whereBetween('tanggal', [$dateRange['start'], $dateRange['end']]);
        } else {
            $query->whereRaw('1 = 0');
        }

        if ($request->user()?->hasRole(User::ROLE_SISWA)) {
            $student = Student::query()->where('nis', $request->user()->username)->first();

            if ($student !== null) {
                $query->where('kelas', $student->kelas);
            }
        } elseif ($request->user()?->hasAnyRole([User::ROLE_GURU_MAPEL, User::ROLE_WALI_KELAS])) {
            $teacher = Teacher::query()->where('nip', $request->user()->username)->first();

            if ($teacher !== null) {
                $query->where(fn ($builder) => $builder->where('guru', $teacher->nama)->orWhereNull('guru'));
            }
        }

        return $query->get();
    }

    private function derivedTasksFromAssignments(Request $request)
    {
        $query = LearningAssignment::query()->orderBy('id');
        $tahunAjaran = $this->resolvedAcademicYear($request);

        if ($tahunAjaran !== null) {
            $query->where('tahun_ajaran', $tahunAjaran);
        } else {
            $query->whereRaw('1 = 0');
        }

        if ($request->user()?->hasRole(User::ROLE_SISWA)) {
            $student = Student::query()->where('nis', $request->user()->username)->first();

            if ($student !== null) {
                $query->where('kelas', $student->kelas);
            }
        } elseif ($request->user()?->hasAnyRole([User::ROLE_GURU_MAPEL, User::ROLE_WALI_KELAS])) {
            $teacher = Teacher::query()->where('nip', $request->user()->username)->first();

            if ($teacher !== null) {
                $query->where('guru_pengampu', $teacher->nama);
            }
        }

        return $query->get()->map(fn (LearningAssignment $assignment) => [
            'id' => $assignment->id,
            'learningAssignmentId' => $assignment->id,
            'judul' => 'Tugas pembelajaran '.$assignment->nama,
            'deskripsi' => $assignment->kelas.' - '.$assignment->guru_pengampu,
            'kelas' => $assignment->kelas,
            'mapel' => $assignment->nama,
            'guru' => $assignment->guru_pengampu,
            'tanggal' => null,
            'status' => 'Aktif',
        ])->values();
    }

    /**
     * @return array{periode: string, bulan: string|null, kelas: string|null}
     */
    private function reportFilters(Request $request): array
    {
        return [
            'periode' => (string) $request->string('periode', 'Bulanan'),
            'bulan' => $request->filled('bulan') && $request->string('bulan') !== 'Data dari backend'
                ? (string) $request->string('bulan')
                : null,
            'kelas' => $request->filled('kelas') && $request->string('kelas') !== 'all'
                ? (string) $request->string('kelas')
                : null,
        ];
    }

    private function applyReportFilters($query, array $filters): void
    {
        if ($filters['kelas'] !== null) {
            $query->where('kelas', $filters['kelas']);
        }

        if ($filters['bulan'] !== null) {
            $monthFilter = $this->monthFilterFromLabel($filters['bulan']);

            if ($monthFilter !== null) {
                $query->whereMonth('tanggal', $monthFilter['month']);

                if ($monthFilter['year'] !== null) {
                    $query->whereYear('tanggal', $monthFilter['year']);
                }
            }
        }
    }

    /**
     * @return array{month: int, year: int|null}|null
     */
    private function monthFilterFromLabel(string $label): ?array
    {
        $year = preg_match('/\b(19\d{2}|20\d{2})\b/', $label, $yearMatch)
            ? (int) $yearMatch[1]
            : null;
        $monthNames = [
            'januari' => 1,
            'februari' => 2,
            'maret' => 3,
            'april' => 4,
            'mei' => 5,
            'juni' => 6,
            'juli' => 7,
            'agustus' => 8,
            'september' => 9,
            'oktober' => 10,
            'november' => 11,
            'desember' => 12,
        ];
        $normalized = strtolower($label);

        foreach ($monthNames as $name => $number) {
            if (str_contains($normalized, $name)) {
                return ['month' => $number, 'year' => $year];
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
     * @param  list<string>  $lines
     */
    private function downloadPdf(string $filename, string $title, array $lines): Response
    {
        $pdf = $this->simplePdf($title, $lines);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * @param  list<string>  $lines
     */
    private function simplePdf(string $title, array $lines): string
    {
        $content = "BT\n/F1 18 Tf\n50 800 Td\n(".$this->pdfText($title).") Tj\n";
        $content .= "/F1 11 Tf\n0 -28 Td\n";

        foreach ($lines as $line) {
            $content .= '(' .$this->pdfText($line).") Tj\n0 -16 Td\n";
        }

        $content .= "ET";
        $objects = [
            '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
            '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
            '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
            '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
            '5 0 obj << /Length '.strlen($content).' >> stream'."\n".$content."\nendstream endobj",
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object."\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        foreach (array_slice($offsets, 1) as $offset) {
            $pdf .= str_pad((string) $offset, 10, '0', STR_PAD_LEFT)." 00000 n \n";
        }

        $pdf .= "trailer << /Size ".(count($objects) + 1)." /Root 1 0 R >>\n";
        $pdf .= "startxref\n".$xrefOffset."\n%%EOF";

        return $pdf;
    }

    /**
     * @param array{
     *   nis: string,
     *   nama: string,
     *   kelas: string,
     *   tahunAjaran: string,
     *   semester: string,
     *   waliKelas: string,
     *   rows: list<array{mapel: string, guru: string, angka: string, predikat: string}>,
     *   totalNilai: string,
     *   rataRata: string,
     *   sakit: string,
     *   izin: string,
     *   alpha: string
     * } $report
     */
    private function studentReportPdf(array $report): string
    {
        $content = '';
        $kopPath = dirname(base_path()).DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'kop-surat.jpg';
        $headerImagePath = is_file($kopPath) ? $kopPath : null;

        if ($headerImagePath !== null) {
            $content .= $this->pdfImage('Im1', 35, 748, 525, 85);
        } else {
            $content .= $this->pdfCenteredTextAt('SMA IT ULIL ALBAB', 298, 807, 15, true);
            $content .= $this->pdfCenteredTextAt('Sistem Informasi Akademik', 298, 790, 9);
        }

        $content .= $this->pdfCenteredTextAt('LAPORAN HASIL BELAJAR', 298, 720, 13, true);
        $content .= $this->pdfLine(205, 717, 391, 717, 1);

        $content .= $this->pdfTextAt('NAMA', 58, 696, 8, true);
        $content .= $this->pdfTextAt(': '.$report['nama'], 145, 696, 8, true);
        $content .= $this->pdfTextAt('NIS', 58, 684, 8, true);
        $content .= $this->pdfTextAt(': '.$report['nis'], 145, 684, 8);
        $content .= $this->pdfTextAt('KELAS', 58, 672, 8, true);
        $content .= $this->pdfTextAt(': '.$report['kelas'], 145, 672, 8);
        $content .= $this->pdfTextAt('TAHUN AJARAN', 335, 696, 8, true);
        $content .= $this->pdfTextAt(': '.$report['tahunAjaran'], 430, 696, 8);
        $content .= $this->pdfTextAt('SEMESTER', 335, 684, 8, true);
        $content .= $this->pdfTextAt(': '.$report['semester'], 430, 684, 8);

        $content .= $this->pdfTextAt('I.', 58, 650, 8, true);
        $content .= $this->pdfTextAt('Nilai Hasil Belajar', 76, 650, 8, true);

        $x = 58;
        $y = 636;
        $rowHeight = 18;
        $widths = [30, 270, 80, 100];
        $headers = ['NO', 'MATA PELAJARAN', 'NILAI', 'PREDIKAT'];
        $content .= $this->pdfTableRow($x, $y, $widths, $headers, $rowHeight, true, true);
        $y -= $rowHeight;

        $maxRows = 14;
        $rows = array_slice($report['rows'], 0, $maxRows);

        foreach ($rows as $index => $row) {
            $content .= $this->pdfTableRow($x, $y, $widths, [
                (string) ($index + 1),
                $row['mapel'],
                $row['angka'],
                $row['predikat'],
            ], $rowHeight);
            $y -= $rowHeight;
        }

        for ($index = count($rows); $index < $maxRows; $index++) {
            $content .= $this->pdfTableRow($x, $y, $widths, [
                (string) ($index + 1),
                '',
                '',
                '',
            ], $rowHeight);
            $y -= $rowHeight;
        }

        $content .= $this->pdfTableRow($x, $y, $widths, ['', 'Total Nilai', $report['totalNilai'], ''], $rowHeight, true);
        $y -= $rowHeight;
        $content .= $this->pdfTableRow($x, $y, $widths, ['', 'Rata-rata', $report['rataRata'], ''], $rowHeight, true);
        $y -= $rowHeight + 22;

        $content .= $this->pdfTextAt('II.', 58, $y, 8, true);
        $content .= $this->pdfTextAt('Catatan Untuk Orang Tua/Wali', 76, $y, 8, true);
        $y -= 13;
        $noteHeight = 18;
        $noteWidth = array_sum($widths);

        for ($index = 0; $index < 5; $index++) {
            $content .= $this->pdfRect($x, $y - $noteHeight + 4, $noteWidth, $noteHeight);
            $y -= $noteHeight;
        }

        $signatureY = max(110, $y - 16);
        $content .= $this->pdfTextAt('Mengetahui,', 72, $signatureY, 8, true);
        $content .= $this->pdfTextAt('Kepala Sekolah,', 72, $signatureY - 13, 8);
        $content .= $this->pdfTextAt('Orang Tua/Wali,', 252, $signatureY - 13, 8);
        $content .= $this->pdfTextAt('Wali Kelas,', 432, $signatureY - 13, 8);
        $content .= $this->pdfLine(64, $signatureY - 72, 166, $signatureY - 72, 1);
        $content .= $this->pdfLine(236, $signatureY - 72, 338, $signatureY - 72, 1);
        $content .= $this->pdfLine(404, $signatureY - 72, 506, $signatureY - 72, 1);

        $content .= $this->pdfStrokeColor(0, 0, 0);

        return $this->buildPdfFromContent($content, $headerImagePath);
    }

    private function studentHomeroomTeacherName(?Student $student, string $tahunAjaran): string
    {
        if ($student === null || trim((string) $student->kelas) === '') {
            return '-';
        }

        $waliKelas = SchoolClass::query()
            ->where('nama', $student->kelas)
            ->when($tahunAjaran !== '', fn ($query) => $query->where('tahun_ajaran', $tahunAjaran))
            ->value('wali_kelas');

        return trim((string) ($waliKelas ?: $student->wali_kelas ?: '-')) ?: '-';
    }

    private function safeReportFilename(string $name): string
    {
        $clean = strtoupper(trim($name));
        $clean = preg_replace('/[^A-Z0-9 _-]/', '', $clean) ?? '';
        $clean = preg_replace('/\s+/', ' ', $clean) ?? '';

        return $clean !== '' ? $clean : 'SISWA';
    }

    private function semesterFromTahunAjaran(string $tahunAjaran): string
    {
        if (str_contains(strtolower($tahunAjaran), 'ganjil')) {
            return 'Ganjil';
        }

        if (str_contains(strtolower($tahunAjaran), 'genap')) {
            return 'Genap';
        }

        $academicYear = AcademicYear::query()
            ->get()
            ->first(fn (AcademicYear $item) => trim($item->nama.' '.$item->semester) === trim($tahunAjaran));

        return $academicYear?->semester ?? '-';
    }

    private function gradeLabelFromAverage(float $average): string
    {
        return match (true) {
            $average >= 90 => 'A',
            $average >= 80 => 'B',
            $average >= 70 => 'C',
            $average >= 60 => 'D',
            default => 'E',
        };
    }

    /**
     * @param list<int> $widths
     * @param list<string> $cells
     */
    private function pdfTableRow(
        int $x,
        int $y,
        array $widths,
        array $cells,
        int $height,
        bool $header = false,
        bool $headerFill = false
    ): string
    {
        $content = '';
        $currentX = $x;

        foreach ($widths as $index => $width) {
            if ($headerFill) {
                $content .= $this->pdfFillColor(213, 255, 255);
                $content .= $this->pdfFilledRect($currentX, $y - $height + 4, $width, $height);
                $content .= $this->pdfFillColor(0, 0, 0);
            }

            $content .= $this->pdfRect($currentX, $y - $height + 4, $width, $height);
            $content .= $this->pdfTextAt(
                $this->pdfCellText($cells[$index] ?? '', $width),
                $currentX + 4,
                $y - 8,
                7,
                $header
            );
            $currentX += $width;
        }

        if ($headerFill) {
            $content .= $this->pdfFillColor(0, 0, 0);
        }

        return $content;
    }

    /**
     * @param list<int> $widths
     */
    private function pdfSummaryRow(int $x, int $y, array $widths, string $label, string $value, string $suffix): string
    {
        $row = ['', $label, '', $value, $suffix];

        return $this->pdfTableRow($x, $y, $widths, $row, 18, true);
    }

    private function pdfCellText(string $text, int $width): string
    {
        $maxChars = max(6, (int) floor($width / 4.3));
        $clean = preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';

        return strlen($clean) > $maxChars ? substr($clean, 0, $maxChars - 3).'...' : $clean;
    }

    private function pdfTextAt(string $text, int $x, int $y, int $size = 10, bool $bold = false): string
    {
        $font = $bold ? 'F2' : 'F1';

        return "BT\n/".$font.' '.$size." Tf\n".$x.' '.$y." Td\n(".$this->pdfText($text).") Tj\nET\n";
    }

    private function pdfCenteredTextAt(string $text, int $centerX, int $y, int $size = 10, bool $bold = false): string
    {
        $clean = preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';
        $estimatedWidth = strlen($clean) * $size * 0.64;
        $x = (int) round($centerX - ($estimatedWidth / 2));

        return $this->pdfTextAt($text, $x, $y, $size, $bold);
    }

    private function pdfCenteredTextWithUnderline(string $text, int $centerX, int $y, int $size = 10, bool $bold = false): string
    {
        $clean = preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';
        $estimatedWidth = strlen($clean) * $size * 0.46;
        $linePadding = 3;
        $lineStart = (int) round($centerX - ($estimatedWidth / 2) - $linePadding);
        $lineEnd = (int) round($centerX + ($estimatedWidth / 2) + $linePadding);

        return $this->pdfCenteredTextAt($text, $centerX, $y, $size, $bold)
            .$this->pdfLine($lineStart, $y - 3, $lineEnd, $y - 3, 1);
    }

    private function pdfLine(int $x1, int $y1, int $x2, int $y2, int $width = 1): string
    {
        return $width." w\n".$x1.' '.$y1.' m '.$x2.' '.$y2." l S\n";
    }

    private function pdfRect(int $x, int $y, int $width, int $height): string
    {
        return $x.' '.$y.' '.$width.' '.$height." re S\n";
    }

    private function pdfFilledRect(int $x, int $y, int $width, int $height): string
    {
        return $x.' '.$y.' '.$width.' '.$height." re f\n";
    }

    private function pdfFillColor(int $red, int $green, int $blue): string
    {
        return ($red / 255).' '.($green / 255).' '.($blue / 255)." rg\n";
    }

    private function pdfStrokeColor(int $red, int $green, int $blue): string
    {
        return ($red / 255).' '.($green / 255).' '.($blue / 255)." RG\n";
    }

    private function pdfImage(string $name, int $x, int $y, int $width, int $height): string
    {
        return "q\n".$width.' 0 0 '.$height.' '.$x.' '.$y." cm\n/".$name." Do\nQ\n";
    }

    private function buildPdfFromContent(string $content, ?string $imagePath = null): string
    {
        $imageObject = null;
        $xObjectResource = '';

        if ($imagePath !== null) {
            $imageInfo = @getimagesize($imagePath);
            $imageData = @file_get_contents($imagePath);

            if ($imageInfo !== false && $imageData !== false && ($imageInfo[2] ?? null) === IMAGETYPE_JPEG) {
                $xObjectResource = ' /XObject << /Im1 7 0 R >>';
                $imageObject = '7 0 obj << /Type /XObject /Subtype /Image /Width '.$imageInfo[0].' /Height '.$imageInfo[1].' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '.strlen($imageData).' >> stream'."\n".$imageData."\nendstream endobj";
            }
        }

        $objects = [
            '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
            '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
            '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>'.$xObjectResource.' >> /Contents 6 0 R >> endobj',
            '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >> endobj',
            '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >> endobj',
            '6 0 obj << /Length '.strlen($content).' >> stream'."\n".$content."\nendstream endobj",
        ];

        if ($imageObject !== null) {
            $objects[] = $imageObject;
        }
        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object."\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        foreach (array_slice($offsets, 1) as $offset) {
            $pdf .= str_pad((string) $offset, 10, '0', STR_PAD_LEFT)." 00000 n \n";
        }

        $pdf .= "trailer << /Size ".(count($objects) + 1)." /Root 1 0 R >>\n";
        $pdf .= "startxref\n".$xrefOffset."\n%%EOF";

        return $pdf;
    }

    private function pdfText(string $text): string
    {
        $text = preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';

        return str_replace(['\\', '(', ')'], ['\\\\', '\(', '\)'], $text);
    }
}
