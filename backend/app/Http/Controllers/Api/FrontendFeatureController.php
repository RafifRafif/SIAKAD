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
                    'nama' => $nama,
                    'tahun_ajaran' => $tahunAjaran,
                    'kelas' => $kelas,
                    'jenis_kelamin' => $row['jenisKelamin'] ?: 'Laki-laki',
                    'email' => $row['email'] ?: null,
                    'telepon' => $row['telepon'] ?: null,
                ],
            );

            $this->syncImportedStudentUser($student);
            $this->refreshSchoolClassStudentCount($kelas);
            $imported++;
        }

        return response()->json([
            'message' => 'Import data siswa selesai.',
            'imported' => $imported,
            'skipped' => $skipped,
            'students' => Student::query()->orderBy('id')->get()->map->toFrontend()->values(),
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
        $grades = StudentGrade::query()->where('nis', $nis)->orderBy('mapel')->get();
        $average = $grades->avg('nilai');
        $rank = $this->rankForStudent($nis);

        $lines = [
            'Rapor Siswa SIAKAD',
            'NIS: '.$nis,
            'Nama: '.($student?->nama ?? '-'),
            'Kelas: '.($student?->kelas ?? '-'),
            'Tahun ajaran: '.($student?->tahun_ajaran ?? '-'),
            'Rata-rata: '.($average !== null ? round((float) $average, 2) : '0'),
            'Peringkat kelas: '.($rank['rank'] ?? '-').'/'.($rank['classSize'] ?? '-'),
            '',
            'Daftar nilai:',
        ];

        foreach ($grades as $grade) {
            $lines[] = $grade->mapel.' - '.$grade->jenis_penilaian.': '.$grade->nilai.' ('.$grade->grade().')';
        }

        return $this->downloadPdf('rapor-'.$nis.'.pdf', 'Rapor Siswa', $lines);
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

        return $request->getSchemeAndHttpHost().'/api/profile/photo-content?v='.$version;
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
        $extension = strtolower($file->getClientOriginalExtension());

        $rows = $extension === 'xlsx'
            ? $this->rowsFromXlsx($file)
            : $this->rowsFromDelimitedFile($file);

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
                'nama' => '',
                'tahunAjaran' => '',
                'kelas' => '',
                'jenisKelamin' => '',
                'email' => '',
                'telepon' => '',
            ];

            foreach ($row as $index => $value) {
                $field = $this->fieldFromHeader($headers[$index] ?? '');

                if ($field !== null) {
                    $mapped[$field] = trim((string) $value);
                }
            }

            if (implode('', $mapped) !== '') {
                $dataRows[] = $mapped;
            }
        }

        return $dataRows;
    }

    /**
     * @return list<list<string>>
     */
    private function rowsFromDelimitedFile(UploadedFile $file): array
    {
        $content = (string) file_get_contents($file->getRealPath());
        $firstLine = strtok($content, "\r\n") ?: '';
        $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';
        $rows = [];

        foreach (preg_split('/\r\n|\r|\n/', $content) ?: [] as $line) {
            if (trim($line) === '') {
                continue;
            }

            $rows[] = str_getcsv($line, $delimiter);
        }

        return $rows;
    }

    /**
     * @return list<list<string>>
     */
    private function rowsFromXlsx(UploadedFile $file): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw ValidationException::withMessages([
                'file' => 'Server belum mendukung pembacaan file XLSX.',
            ]);
        }

        $zip = new ZipArchive();

        if ($zip->open($file->getRealPath()) !== true) {
            throw ValidationException::withMessages([
                'file' => 'File XLSX tidak dapat dibaca.',
            ]);
        }

        $sharedStrings = [];
        $sharedXml = $zip->getFromName('xl/sharedStrings.xml');

        if ($sharedXml !== false) {
            $shared = simplexml_load_string($sharedXml);

            if ($shared !== false) {
                foreach ($shared->si as $item) {
                    $sharedStrings[] = (string) ($item->t ?? $item->r->t ?? '');
                }
            }
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetXml === false) {
            throw ValidationException::withMessages([
                'file' => 'Sheet pertama tidak ditemukan.',
            ]);
        }

        $sheet = simplexml_load_string($sheetXml);

        if ($sheet === false) {
            throw ValidationException::withMessages([
                'file' => 'Sheet pertama tidak dapat dibaca.',
            ]);
        }

        $sheet->registerXPathNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $rowNodes = $sheet->xpath('//m:sheetData/m:row') ?: [];
        $rows = [];

        foreach ($rowNodes as $rowNode) {
            $row = [];
            $cells = $rowNode->xpath('m:c') ?: [];

            foreach ($cells as $cell) {
                $attributes = $cell->attributes();
                $cellRef = (string) ($attributes['r'] ?? '');
                $columnIndex = $this->xlsxColumnIndex($cellRef);
                $type = (string) ($attributes['t'] ?? '');
                $value = (string) ($cell->v ?? '');

                if ($type === 's' && isset($sharedStrings[(int) $value])) {
                    $value = $sharedStrings[(int) $value];
                } elseif ($type === 'inlineStr') {
                    $inline = $cell->xpath('m:is/m:t');
                    $value = isset($inline[0]) ? (string) $inline[0] : $value;
                }

                $row[$columnIndex] = $value;
            }

            ksort($row);
            $rows[] = array_values($row);
        }

        return $rows;
    }

    private function xlsxColumnIndex(string $cellRef): int
    {
        $letters = preg_replace('/[^A-Z]/', '', strtoupper($cellRef)) ?: 'A';
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }

        return max(0, $index - 1);
    }

    private function normalizeHeader(string $header): string
    {
        return preg_replace('/[^a-z0-9]/', '', strtolower($header)) ?? '';
    }

    private function fieldFromHeader(string $header): ?string
    {
        return match ($header) {
            'nis', 'nomorinduk', 'nomorinduksiswa' => 'nis',
            'nama', 'namalengkap', 'namasiswa' => 'nama',
            'tahunajaran', 'tahun' => 'tahunAjaran',
            'kelas', 'class' => 'kelas',
            'jeniskelamin', 'jk', 'gender' => 'jenisKelamin',
            'email', 'emailaddress', 'surel' => 'email',
            'telepon', 'telp', 'nohp', 'hp', 'phone' => 'telepon',
            default => null,
        };
    }

    private function syncImportedStudentUser(Student $student): void
    {
        $user = User::query()->firstOrNew(['username' => $student->nis]);
        $user->fill([
            'name' => $student->nama,
            'email' => $student->email ?: $student->nis.'@siakad.local',
            'roles' => [User::ROLE_SISWA],
            'email_verified_at' => now(),
        ]);

        if (! $user->exists) {
            $user->password = Hash::make($student->nis);
        }

        $user->save();
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

    private function pdfText(string $text): string
    {
        $text = preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';

        return str_replace(['\\', '(', ')'], ['\\\\', '\(', '\)'], $text);
    }
}
