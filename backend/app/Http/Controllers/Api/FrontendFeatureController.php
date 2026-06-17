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
use Maatwebsite\Excel\Concerns\WithFormatData;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Symfony\Component\HttpFoundation\Response;

class FrontendFeatureController extends Controller
{
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
                    'nama' => $nama,
                    'tahun_ajaran' => $tahunAjaran,
                    'roles' => $roles,
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
        $months = AttendanceRecord::query()
            ->whereNotNull('tanggal')
            ->pluck('tanggal')
            ->merge(StudentGrade::query()->whereNotNull('tanggal')->pluck('tanggal'))
            ->map(fn ($date) => Carbon::parse($date)->locale('id')->translatedFormat('F Y'))
            ->unique()
            ->values();

        $classes = SchoolClass::query()
            ->pluck('nama')
            ->merge(Student::query()->pluck('kelas'))
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
        $this->applyReportFilters($attendanceQuery, $filters);
        $this->applyReportFilters($gradeQuery, $filters);

        $attendanceTotal = (clone $attendanceQuery)->count();
        $attendancePresent = (clone $attendanceQuery)->whereIn('status', ['hadir', 'Hadir'])->count();
        $averageGrade = (clone $gradeQuery)->avg('nilai');

        $lines = [
            'Laporan Akademik SIAKAD',
            'Periode: '.$filters['periode'],
            'Bulan: '.($filters['bulan'] ?: 'Semua bulan'),
            'Kelas: '.($filters['kelas'] ?: 'Semua kelas'),
            'Total siswa: '.Student::query()->count(),
            'Total guru: '.Teacher::query()->count(),
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
        $tahunAjaran = (string) $request->string('tahunAjaran', $student?->tahun_ajaran ?? '');
        $semester = $this->semesterFromTahunAjaran($tahunAjaran);
        $kelas = $student?->kelas ?? '-';
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
            'rows' => $rows,
            'totalNilai' => count($nilaiTerisi) > 0 ? (string) round($totalNilai, 2) : '-',
            'rataRata' => $rataRata !== null ? (string) $rataRata : '-',
            'sakit' => (string) $attendance->filter(fn (AttendanceRecord $record) => in_array($record->status, ['sakit', 'Sakit'], true))->count(),
            'izin' => (string) $attendance->filter(fn (AttendanceRecord $record) => in_array($record->status, ['izin', 'Izin'], true))->count(),
            'alpha' => (string) $attendance->filter(fn (AttendanceRecord $record) => in_array($record->status, ['alpha', 'Alpha', 'Tidak Hadir'], true))->count(),
        ]);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="rapor-'.$nis.'.pdf"',
        ]);
    }

    public function studentInsights(Request $request): JsonResponse
    {
        $nis = $this->targetNis($request);
        $rank = $this->rankForStudent($nis);

        return response()->json([
            'rank' => $rank['rank'],
            'classSize' => $rank['classSize'],
            'notes' => StudentNote::query()
                ->where('nis', $nis)
                ->orderByDesc('tanggal')
                ->orderByDesc('id')
                ->get()
                ->map->toFrontend()
                ->values(),
            'achievements' => StudentAchievement::query()
                ->where('nis', $nis)
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

        $agendaQuery = ClassAgenda::query();
        $reminderQuery = ClassReminder::query();

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
            ->whereIn('status', ['alpha', 'Alpha', 'Tidak Hadir'])
            ->whereDate('tanggal', '>=', now()->subDays(7)->toDateString())
            ->count();

        return response()->json([
            'kelas' => $className,
            'totalStudents' => Student::query()
                ->when($className, fn ($query) => $query->where('kelas', $className))
                ->count(),
            'attendanceToday' => AttendanceRecord::query()
                ->when($className, fn ($query) => $query->where('kelas', $className))
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
            'username' => $user->username,
            'role' => $user->frontendRole(),
            'guruAccess' => $user->guruAccess(),
            'nama' => $student?->nama ?? $teacher?->nama ?? $user->name,
            'email' => $student?->email ?? $teacher?->email ?? $user->email,
            'telepon' => $student?->telepon ?? $teacher?->telepon ?? $profile?->telepon,
            'alamat' => $profile?->alamat,
            'tanggalLahir' => $profile?->tanggal_lahir?->format('Y-m-d'),
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
        $student = Student::query()->where('nis', $user->username)->first();

        if ($student !== null) {
            $student->update([
                'nama' => trim($data['nama']),
                'email' => $data['email'] ? trim($data['email']) : null,
                'telepon' => isset($data['telepon']) ? trim($data['telepon']) : null,
            ]);

            StudentGrade::query()->where('nis', $student->nis)->update(['nama' => trim($data['nama'])]);
            AttendanceRecord::query()->where('nis', $student->nis)->update(['nama' => trim($data['nama'])]);
            QuranSubmission::query()->where('nis', $student->nis)->update(['nama' => trim($data['nama'])]);

            return;
        }

        $teacher = Teacher::query()->where('nip', $user->username)->first();

        if ($teacher !== null) {
            $previousName = $teacher->nama;
            $teacher->update([
                'nama' => trim($data['nama']),
                'email' => $data['email'] ? trim($data['email']) : null,
                'telepon' => isset($data['telepon']) ? trim($data['telepon']) : null,
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
            $sheets = Excel::toArray(new class implements WithFormatData
            {
            }, $file);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'file' => 'File import tidak dapat dibaca. Pastikan format file adalah XLSX, XLS, atau CSV yang valid.',
            ]);
        }

        $rows = $sheets[0] ?? [];

        if (count($rows) < 2) {
            throw ValidationException::withMessages([
                'file' => 'File import harus memiliki header dan minimal satu baris data.',
            ]);
        }

        $headers = array_map(fn ($header) => $this->normalizeHeader((string) $header), $rows[0]);
        $dataRows = [];

        foreach (array_slice($rows, 1) as $row) {
            $mapped = [
                'nis' => '',
                'nisn' => '',
                'nik' => '',
                'nip' => '',
                'nama' => '',
                'tahunAjaran' => '',
                'kelas' => '',
                'waliKelas' => '',
                'asalSekolah' => '',
                'namaOrangTua' => '',
                'jenisKelamin' => '',
                'tempatLahir' => '',
                'tanggalLahir' => '',
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
            try {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            } catch (\Throwable) {
                return $value;
            }
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
            'nama', 'namalengkap', 'namasiswa' => 'nama',
            'tahunajaran', 'tahun' => 'tahunAjaran',
            'kelas', 'class' => 'kelas',
            'walikelas', 'wali' => 'waliKelas',
            'asalsekolah', 'sekolahasal' => 'asalSekolah',
            'namaorangtua', 'orangtua', 'namaortu' => 'namaOrangTua',
            'jeniskelamin', 'jk', 'gender' => 'jenisKelamin',
            'tempatlahir', 'tempat' => 'tempatLahir',
            'tanggallahir', 'tgllahir', 'ttl' => 'tanggalLahir',
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
            ->update([
                'jumlah_siswa' => Student::query()->where('kelas', $className)->count(),
            ]);
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
    private function rankForStudent(string $nis): array
    {
        $student = Student::query()->where('nis', $nis)->first();

        if ($student === null) {
            return ['rank' => null, 'classSize' => 0];
        }

        $averages = StudentGrade::query()
            ->where('kelas', $student->kelas)
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
            'classSize' => Student::query()->where('kelas', $student->kelas)->count(),
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

        return SchoolClass::query()->where('wali_kelas', $teacher->nama)->value('nama');
    }

    private function filteredLearningTasks(Request $request)
    {
        $query = LearningTask::query()->orderByDesc('tanggal')->orderByDesc('id');

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
        $logoPath = dirname(base_path()).DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'logo.png';
        $content .= $this->pdfImage('Im1', 42, 775, 38, 38);
        $content .= $this->pdfTextAt('LAPORAN HASIL BELAJAR SISWA ONLINE', 182, 808, 10, true);
        $content .= $this->pdfTextAt('SMA IT ULIL ALBAB', 238, 794, 11, true);
        $content .= $this->pdfImage('Im1', 515, 775, 38, 38);
        $content .= $this->pdfLine(35, 764, 560, 764, 2);
        $content .= $this->pdfTextAt('RAPOR HASIL BELAJAR', 236, 742, 10, true);

        $content .= $this->pdfTextAt('Nama', 70, 712, 9);
        $content .= $this->pdfTextAt(': '.$report['nama'], 145, 712, 9);
        $content .= $this->pdfTextAt('Kelas', 70, 696, 9);
        $content .= $this->pdfTextAt(': '.$report['kelas'], 145, 696, 9);
        $content .= $this->pdfTextAt('Tahun Ajaran', 330, 712, 9);
        $content .= $this->pdfTextAt(': '.$report['tahunAjaran'], 420, 712, 9);
        $content .= $this->pdfTextAt('Semester', 330, 696, 9);
        $content .= $this->pdfTextAt(': '.$report['semester'], 420, 696, 9);

        $x = 55;
        $y = 660;
        $rowHeight = 18;
        $widths = [30, 210, 145, 55, 65];
        $headers = ['No', 'Nama Mata Pelajaran', 'Guru Ampu', 'Angka', 'Predikat'];
        $content .= $this->pdfTableRow($x, $y, $widths, $headers, $rowHeight, true);
        $y -= $rowHeight;

        $maxRows = 14;
        $rows = array_slice($report['rows'], 0, $maxRows);

        foreach ($rows as $index => $row) {
            $content .= $this->pdfTableRow($x, $y, $widths, [
                (string) ($index + 1),
                $row['mapel'],
                $row['guru'],
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
                '',
            ], $rowHeight);
            $y -= $rowHeight;
        }

        $content .= $this->pdfSummaryRow($x, $y, $widths, 'Total Nilai', $report['totalNilai'], '');
        $y -= $rowHeight;
        $content .= $this->pdfSummaryRow($x, $y, $widths, 'Rata - rata', $report['rataRata'], '');
        $y -= $rowHeight;
        $content .= $this->pdfSummaryRow($x, $y, $widths, 'Sakit', $report['sakit'], 'hari');
        $y -= $rowHeight;
        $content .= $this->pdfSummaryRow($x, $y, $widths, 'Izin', $report['izin'], 'hari');
        $y -= $rowHeight;
        $content .= $this->pdfSummaryRow($x, $y, $widths, 'Tanpa Keterangan', $report['alpha'], 'hari');

        $signatureY = 135;
        $content .= $this->pdfTextAt('Orang Tua/Wali', 80, $signatureY, 8, true);
        $content .= $this->pdfTextAt('Wali Kelas', 250, $signatureY, 8, true);
        $content .= $this->pdfTextAt('Kepala Sekolah', 410, $signatureY, 8, true);
        $content .= $this->pdfLine(72, 80, 160, 80, 1);
        $content .= $this->pdfLine(230, 80, 318, 80, 1);
        $content .= $this->pdfLine(392, 80, 480, 80, 1);

        return $this->buildPdfFromContent($content, is_file($logoPath) ? $logoPath : null);
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
    private function pdfTableRow(int $x, int $y, array $widths, array $cells, int $height, bool $header = false): string
    {
        $content = '';
        $currentX = $x;

        foreach ($widths as $index => $width) {
            $content .= $this->pdfRect($currentX, $y - $height + 4, $width, $height);
            $content .= $this->pdfTextAt($this->pdfCellText($cells[$index] ?? '', $width), $currentX + 4, $y - 8, 7, $header);
            $currentX += $width;
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

    private function pdfLine(int $x1, int $y1, int $x2, int $y2, int $width = 1): string
    {
        return $width." w\n".$x1.' '.$y1.' m '.$x2.' '.$y2." l S\n";
    }

    private function pdfRect(int $x, int $y, int $width, int $height): string
    {
        return $x.' '.$y.' '.$width.' '.$height." re S\n";
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
            '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
            '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
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
