<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\AssessmentSetting;
use App\Models\AttendanceRecord;
use App\Models\ClassAgenda;
use App\Models\ClassReminder;
use App\Models\LearningAssignment;
use App\Models\LearningTask;
use App\Models\QuranSubmission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\StudentAchievement;
use App\Models\StudentNote;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class MasterDataController extends Controller
{
    public function academicYears(): JsonResponse
    {
        return response()->json(
            AcademicYear::query()->orderBy('id')->get()->map->toFrontend()->values()
        );
    }

    public function storeAcademicYear(Request $request): JsonResponse
    {
        $payload = $this->academicYearPayload($request);
        $status = 201;

        $academicYear = AcademicYear::query()
            ->whereRaw('LOWER(nama) = ?', [strtolower($payload['nama'])])
            ->where('semester', $payload['semester'])
            ->first();

        if ($academicYear === null) {
            $academicYear = AcademicYear::query()->create($payload);
        } else {
            $status = 200;
            $academicYear->fill([
                'tanggal_mulai' => $payload['tanggal_mulai'],
                'tanggal_selesai' => $payload['tanggal_selesai'],
                'status' => $payload['status'],
            ])->save();
        }

        $this->archiveOtherActiveAcademicYears($academicYear);

        return response()->json($academicYear->fresh()->toFrontend(), $status);
    }

    public function updateAcademicYear(Request $request, AcademicYear $academicYear): JsonResponse
    {
        $academicYear->update($this->academicYearPayload($request));
        $this->archiveOtherActiveAcademicYears($academicYear);

        return response()->json($academicYear->fresh()->toFrontend());
    }

    public function setActiveAcademicYear(AcademicYear $academicYear): JsonResponse
    {
        $academicYear->update(['status' => 'Aktif']);
        $this->archiveOtherActiveAcademicYears($academicYear);

        return response()->json($academicYear->fresh()->toFrontend());
    }

    public function deleteAcademicYear(AcademicYear $academicYear): JsonResponse
    {
        $academicYear->delete();

        return response()->json(['message' => 'Tahun ajaran berhasil dihapus.']);
    }

    public function students(Request $request): JsonResponse
    {
        $query = Student::query()->orderBy('id');

        $this->applyAcademicYearScope(
            $query,
            'tahun_ajaran',
            $request,
            ! $request->user()?->hasRole(User::ROLE_ADMIN)
        );

        if ($request->filled('kelas')) {
            $query->where('kelas', (string) $request->string('kelas'));
        }

        $this->applyVisibleClassScope($query, $request->user(), 'kelas');

        return response()->json(
            $query->get()->map->toFrontend()->values()
        );
    }

    public function storeStudent(Request $request): JsonResponse
    {
        $student = DB::transaction(function () use ($request): Student {
            $student = Student::query()->create($this->studentPayload($request));

            $this->syncStudentUser($student);
            $this->refreshSchoolClassStudentCount($student->kelas);

            return $student->fresh();
        });

        return response()->json($student->toFrontend(), 201);
    }

    public function updateStudent(Request $request, Student $student): JsonResponse
    {
        $student = DB::transaction(function () use ($request, $student): Student {
            $previousNis = $student->nis;
            $previousClass = $student->kelas;

            $student->update($this->studentPayload($request, $student));
            $student = $student->fresh();

            $this->syncStudentUser($student, $previousNis);
            $this->syncAcademicRecordsForStudent($previousNis, $student);
            $this->refreshSchoolClassStudentCount($previousClass);
            $this->refreshSchoolClassStudentCount($student->kelas);

            return $student;
        });

        return response()->json($student->toFrontend());
    }

    public function deleteStudent(Student $student): JsonResponse
    {
        $previousClass = $student->kelas;

        DB::transaction(function () use ($student, $previousClass): void {
            User::query()
                ->where('username', $student->nis)
                ->whereJsonContains('roles', User::ROLE_SISWA)
                ->delete();

            $student->delete();
            $this->refreshSchoolClassStudentCount($previousClass);
        });

        return response()->json(['message' => 'Siswa berhasil dihapus.']);
    }

    public function teachers(): JsonResponse
    {
        return response()->json(
            Teacher::query()->orderBy('id')->get()->map->toFrontend()->values()
        );
    }

    public function storeTeacher(Request $request): JsonResponse
    {
        $teacher = DB::transaction(function () use ($request): array {
            $requestedNip = trim((string) $request->input('nip', ''));
            $teacher = $requestedNip !== ''
                ? Teacher::query()->where('nip', $requestedNip)->lockForUpdate()->first()
                : null;
            $status = 201;

            if ($teacher === null) {
                $teacher = Teacher::query()->create($this->teacherPayload($request));
            } else {
                $status = 200;
                $previousName = $teacher->nama;
                $teacher->update($this->teacherPayload($request, $teacher));
                $teacher = $teacher->fresh();

                $this->syncTeacherNameReferences($previousName, $teacher->nama);
            }

            $this->syncTeacherUser($teacher);

            return [$teacher->fresh(), $status];
        });

        return response()->json($teacher[0]->toFrontend(), $teacher[1]);
    }

    public function updateTeacher(Request $request, Teacher $teacher): JsonResponse
    {
        $previousNip = $teacher->nip;
        $previousName = $teacher->nama;

        $teacher->update($this->teacherPayload($request, $teacher));
        $teacher = $teacher->fresh();

        $this->syncTeacherUser($teacher, $previousNip);
        $this->syncTeacherNameReferences($previousName, $teacher->nama);

        return response()->json($teacher->toFrontend());
    }

    public function deleteTeacher(Teacher $teacher): JsonResponse
    {
        User::query()->where('username', $teacher->nip)->delete();
        $teacher->delete();

        return response()->json(['message' => 'Guru berhasil dihapus.']);
    }

    public function schoolClasses(Request $request): JsonResponse
    {
        $query = SchoolClass::query()->orderBy('id');

        $this->applyAcademicYearScope(
            $query,
            'tahun_ajaran',
            $request,
            ! $request->user()?->hasRole(User::ROLE_ADMIN)
        );

        $this->applyVisibleClassScope($query, $request->user(), 'nama');

        return response()->json(
            $query->get()->map->toFrontend()->values()
        );
    }

    public function storeSchoolClass(Request $request): JsonResponse
    {
        $payload = $this->schoolClassPayload($request);
        $status = 201;

        $schoolClass = SchoolClass::query()
            ->where('nama', $payload['nama'])
            ->where('tahun_ajaran', $payload['tahun_ajaran'])
            ->where('kelompok', $payload['kelompok'])
            ->first();

        if ($schoolClass === null) {
            $schoolClass = SchoolClass::query()->create($payload);
        } else {
            $status = 200;
            $schoolClass->fill([
                'wali_kelas' => $payload['wali_kelas'],
            ])->save();
        }

        $this->refreshSchoolClassStudentCount($schoolClass->nama);

        return response()->json($schoolClass->fresh()->toFrontend(), $status);
    }

    public function updateSchoolClass(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $previousName = $schoolClass->nama;

        $schoolClass->update($this->schoolClassPayload($request));
        $schoolClass = $schoolClass->fresh();

        if ($previousName !== $schoolClass->nama) {
            $this->syncClassNameReferences($previousName, $schoolClass->nama);
        }

        $this->refreshSchoolClassStudentCount($previousName);
        $this->refreshSchoolClassStudentCount($schoolClass->nama);

        return response()->json($schoolClass->fresh()->toFrontend());
    }

    public function deleteSchoolClass(SchoolClass $schoolClass): JsonResponse
    {
        if (Student::query()->where('kelas', $schoolClass->nama)->exists()) {
            return response()->json([
                'message' => 'Kelas masih digunakan oleh data siswa.',
            ], 422);
        }

        $schoolClass->delete();

        return response()->json(['message' => 'Kelas berhasil dihapus.']);
    }

    public function subjects(Request $request): JsonResponse
    {
        $query = Subject::query()->orderBy('id');

        $this->applyAcademicYearScope(
            $query,
            'tahun_ajaran',
            $request,
            ! $request->user()?->hasRole(User::ROLE_ADMIN)
        );

        if (! $request->user()?->hasRole(User::ROLE_ADMIN)) {
            $teacherName = $this->teacherNameForUser($request->user());

            if ($teacherName === null) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereExists(function ($subQuery) use ($teacherName): void {
                    $subQuery
                        ->selectRaw('1')
                        ->from('learning_assignments')
                        ->whereColumn('learning_assignments.nama', 'subjects.nama')
                        ->whereColumn('learning_assignments.tahun_ajaran', 'subjects.tahun_ajaran')
                        ->where('learning_assignments.guru_pengampu', $teacherName);
                });
            }
        }

        return response()->json(
            $query->get()->map->toFrontend()->values()
        );
    }

    public function storeSubject(Request $request): JsonResponse
    {
        $payload = $this->subjectPayload($request);
        $status = 201;

        $subject = Subject::query()
            ->whereRaw('LOWER(nama) = ?', [strtolower($payload['nama'])])
            ->where('tahun_ajaran', $payload['tahun_ajaran'])
            ->first();

        if ($subject === null) {
            $subject = Subject::query()->create($payload);
        } else {
            $status = 200;
        }

        return response()->json($subject->toFrontend(), $status);
    }

    public function updateSubject(Request $request, Subject $subject): JsonResponse
    {
        $previousName = $subject->nama;

        $subject->update($this->subjectPayload($request));
        $subject = $subject->fresh();

        if ($previousName !== $subject->nama) {
            $this->syncSubjectNameReferences($previousName, $subject->nama);
        }

        return response()->json($subject->toFrontend());
    }

    public function deleteSubject(Subject $subject): JsonResponse
    {
        $subject->delete();

        return response()->json(['message' => 'Pelajaran berhasil dihapus.']);
    }

    public function learningAssignments(Request $request): JsonResponse
    {
        $query = LearningAssignment::query()->orderBy('id');

        $this->applyAcademicYearScope(
            $query,
            'tahun_ajaran',
            $request,
            ! $request->user()?->hasRole(User::ROLE_ADMIN)
        );

        if (! $request->user()?->hasRole(User::ROLE_ADMIN)) {
            $teacherName = $this->teacherNameForUser($request->user());

            if ($teacherName !== null) {
                $query->where('guru_pengampu', $teacherName);
            }
        }

        return response()->json(
            $query->get()->map->toFrontend()->values()
        );
    }

    public function storeLearningAssignment(Request $request): JsonResponse
    {
        $payload = $this->learningAssignmentPayload($request);
        $status = 201;

        $assignment = LearningAssignment::query()
            ->whereRaw('LOWER(nama) = ?', [strtolower($payload['nama'])])
            ->where('tahun_ajaran', $payload['tahun_ajaran'])
            ->where('kelas', $payload['kelas'])
            ->where('kelompok', $payload['kelompok'])
            ->first();

        if ($assignment === null) {
            $assignment = LearningAssignment::query()->create($payload);
        } else {
            $status = 200;
            $assignment->fill([
                'guru_pengampu' => $payload['guru_pengampu'],
            ])->save();
        }

        return response()->json($assignment->fresh()->toFrontend(), $status);
    }

    public function updateLearningAssignment(
        Request $request,
        LearningAssignment $learningAssignment,
    ): JsonResponse {
        $learningAssignment->update($this->learningAssignmentPayload($request));

        return response()->json($learningAssignment->fresh()->toFrontend());
    }

    public function deleteLearningAssignment(LearningAssignment $learningAssignment): JsonResponse
    {
        $learningAssignment->delete();

        return response()->json(['message' => 'Pembelajaran berhasil dihapus.']);
    }

    public function assessmentSetting(): JsonResponse
    {
        $setting = AssessmentSetting::query()->first();

        return response()->json(
            $setting?->toFrontend() ?? [
                'bobot' => [],
                'gradeRanges' => [],
            ]
        );
    }

    public function updateAssessmentSetting(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bobot' => ['required', 'array'],
            'bobot.*.id' => ['required', 'string'],
            'bobot.*.jenisPenilaian' => ['required', 'string'],
            'bobot.*.bobot' => ['required', 'numeric', 'min:0', 'max:100'],
            'gradeRanges' => ['required', 'array'],
            'gradeRanges.*.id' => ['required', 'string'],
            'gradeRanges.*.grade' => ['required', 'string'],
            'gradeRanges.*.nilaiMinimum' => ['required', 'numeric', 'min:0', 'max:100'],
            'gradeRanges.*.nilaiMaksimum' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $setting = AssessmentSetting::query()->updateOrCreate(['id' => 1], [
            'bobot' => $data['bobot'],
            'grade_ranges' => $data['gradeRanges'],
        ]);

        return response()->json($setting->toFrontend());
    }

    /**
     * @return array<string, mixed>
     */
    private function academicYearPayload(Request $request): array
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'semester' => ['required', Rule::in(['Ganjil', 'Genap'])],
            'tanggalMulai' => ['required', 'date'],
            'tanggalSelesai' => ['required', 'date', 'after_or_equal:tanggalMulai'],
            'status' => ['required', Rule::in(['Aktif', 'Draft', 'Arsip'])],
        ]);

        return [
            'nama' => trim($data['nama']),
            'semester' => $data['semester'],
            'tanggal_mulai' => $data['tanggalMulai'],
            'tanggal_selesai' => $data['tanggalSelesai'],
            'status' => $data['status'],
        ];
    }

    private function archiveOtherActiveAcademicYears(AcademicYear $academicYear): void
    {
        if ($academicYear->status !== 'Aktif') {
            return;
        }

        AcademicYear::query()
            ->where('id', '!=', $academicYear->id)
            ->where('status', 'Aktif')
            ->update(['status' => 'Arsip']);
    }

    private function applyAcademicYearScope(
        $query,
        string $column,
        Request $request,
        bool $defaultToActive = false
    ): void {
        if ($request->filled('tahunAjaran') && $request->string('tahunAjaran') !== 'all') {
            $query->where($column, (string) $request->string('tahunAjaran'));

            return;
        }

        if (! $defaultToActive) {
            return;
        }

        $activeAcademicYear = $this->activeAcademicYearValue();

        if ($activeAcademicYear === null) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where($column, $activeAcademicYear);
    }

    /**
     * @return array<string, mixed>
     */
    private function studentPayload(Request $request, ?Student $student = null): array
    {
        $requestedNis = (string) $request->input('nis', $student?->nis ?? '');
        $userIdToIgnore = $student !== null
            ? User::query()->where('username', $student->nis)->value('id')
            : $this->reusableStudentUserId($requestedNis);

        $data = $request->validate([
            'nis' => [
                'required',
                'string',
                'max:255',
                'regex:/^[0-9]+$/',
                Rule::unique('students', 'nis')->ignore($student?->id),
                $this->uniqueUserUsernameRule($userIdToIgnore),
            ],
            'nisn' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[0-9]+$/',
                Rule::unique('students', 'nisn')->ignore($student?->id),
            ],
            'nik' => ['nullable', 'string', 'max:255', 'regex:/^[0-9]+$/'],
            'nama' => ['required', 'string', 'max:255'],
            'tahunAjaran' => ['required', 'string', 'max:255'],
            'kelas' => ['required', 'string', 'max:255'],
            'waliKelas' => ['nullable', 'string', 'max:255'],
            'asalSekolah' => ['nullable', 'string', 'max:255'],
            'namaOrangTua' => ['nullable', 'string', 'max:255'],
            'jenisKelamin' => ['required', 'string', 'max:255'],
            'tempatLahir' => ['nullable', 'string', 'max:255'],
            'tanggalLahir' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                $this->uniqueUserEmailRule($userIdToIgnore),
            ],
            'telepon' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('students', 'telepon')->ignore($student?->id),
            ],
        ]);

        return [
            'nis' => trim($data['nis']),
            'nisn' => isset($data['nisn']) ? trim($data['nisn']) : null,
            'nik' => isset($data['nik']) ? trim($data['nik']) : null,
            'nama' => trim($data['nama']),
            'tahun_ajaran' => trim($data['tahunAjaran']),
            'kelas' => trim($data['kelas']),
            'wali_kelas' => isset($data['waliKelas']) ? trim($data['waliKelas']) : null,
            'asal_sekolah' => isset($data['asalSekolah']) ? trim($data['asalSekolah']) : null,
            'nama_orang_tua' => isset($data['namaOrangTua']) ? trim($data['namaOrangTua']) : null,
            'jenis_kelamin' => $data['jenisKelamin'],
            'tempat_lahir' => isset($data['tempatLahir']) ? trim($data['tempatLahir']) : null,
            'tanggal_lahir' => $data['tanggalLahir'] ?? null,
            'alamat' => isset($data['alamat']) ? trim($data['alamat']) : null,
            'email' => isset($data['email']) ? trim($data['email']) : null,
            'telepon' => isset($data['telepon']) ? trim($data['telepon']) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function teacherPayload(Request $request, ?Teacher $teacher = null): array
    {
        $userIdToIgnore = $teacher !== null
            ? User::query()->where('username', $teacher->nip)->value('id')
            : null;

        $data = $request->validate([
            'nip' => [
                'required',
                'string',
                'max:255',
                Rule::unique('teachers', 'nip')->ignore($teacher?->id),
                $this->uniqueUserUsernameRule($userIdToIgnore),
            ],
            'nuptk' => ['nullable', 'string', 'max:255', 'regex:/^[0-9]+$/'],
            'nik' => ['nullable', 'string', 'max:255', 'regex:/^[0-9]+$/'],
            'nama' => ['required', 'string', 'max:255'],
            'tahunAjaran' => ['required', 'string', 'max:255'],
            'role' => ['required', 'array', 'min:1'],
            'role.*' => ['required', Rule::in(['Wali Kelas', 'Guru Mapel'])],
            'tempatLahir' => ['nullable', 'string', 'max:255'],
            'tanggalLahir' => ['nullable', 'date'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'alamat' => ['nullable', 'string'],
            'sapaan' => ['nullable', Rule::in(['Ustad', 'Ustadzah', ''])],
            'email' => [
                'nullable',
                'email',
                'max:255',
                $this->uniqueUserEmailRule($userIdToIgnore),
            ],
            'telepon' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['Aktif', 'Cuti'])],
        ]);

        return [
            'nip' => trim($data['nip']),
            'nuptk' => isset($data['nuptk']) ? trim($data['nuptk']) : null,
            'nik' => isset($data['nik']) ? trim($data['nik']) : null,
            'nama' => trim($data['nama']),
            'tahun_ajaran' => trim($data['tahunAjaran']),
            'roles' => array_values($data['role']),
            'tempat_lahir' => isset($data['tempatLahir']) ? trim($data['tempatLahir']) : null,
            'tanggal_lahir' => $data['tanggalLahir'] ?? null,
            'jabatan' => isset($data['jabatan']) ? trim($data['jabatan']) : null,
            'alamat' => isset($data['alamat']) ? trim($data['alamat']) : null,
            'sapaan' => isset($data['sapaan']) ? trim($data['sapaan']) : null,
            'email' => isset($data['email']) ? trim($data['email']) : null,
            'telepon' => isset($data['telepon']) ? trim($data['telepon']) : null,
            'status' => $data['status'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function schoolClassPayload(Request $request): array
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'tahunAjaran' => ['required', 'string', 'max:255'],
            'kelompok' => ['required', Rule::in(['Ikhwan', 'Akhwat'])],
            'waliKelas' => ['nullable', 'string', 'max:255'],
            'jumlahSiswa' => ['required', 'integer', 'min:0'],
        ]);

        return [
            'nama' => $data['nama'],
            'tahun_ajaran' => $data['tahunAjaran'],
            'kelompok' => $data['kelompok'],
            'wali_kelas' => $data['waliKelas'] ?? null,
            'jumlah_siswa' => $data['jumlahSiswa'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function subjectPayload(Request $request): array
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'tahunAjaran' => ['required', 'string', 'max:255'],
        ]);

        return [
            'nama' => trim($data['nama']),
            'tahun_ajaran' => trim($data['tahunAjaran']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function learningAssignmentPayload(Request $request): array
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'tahunAjaran' => ['required', 'string', 'max:255'],
            'guruPengampu' => ['required', 'string', 'max:255'],
            'kelas' => ['required', 'string', 'max:255'],
            'kelompok' => ['required', Rule::in(['Ikhwan', 'Akhwat'])],
        ]);

        return [
            'nama' => trim($data['nama']),
            'tahun_ajaran' => trim($data['tahunAjaran']),
            'guru_pengampu' => trim($data['guruPengampu']),
            'kelas' => trim($data['kelas']),
            'kelompok' => $data['kelompok'],
        ];
    }

    private function syncTeacherUser(Teacher $teacher, ?string $previousUsername = null): void
    {
        $roles = [];

        if (in_array('Guru Mapel', $teacher->roles ?? [], true)) {
            $roles[] = User::ROLE_GURU_MAPEL;
        }

        if (in_array('Wali Kelas', $teacher->roles ?? [], true)) {
            $roles[] = User::ROLE_WALI_KELAS;
        }

        $user = $previousUsername !== null
            ? User::query()->where('username', $previousUsername)->first()
            : null;

        $user ??= User::query()->firstOrNew(['username' => $teacher->nip]);
        $user->fill([
            'name' => $teacher->nama,
            'username' => $teacher->nip,
            'email' => $teacher->email ?: strtolower($teacher->nip).'@siakad.local',
            'roles' => $roles,
            'email_verified_at' => now(),
        ]);

        $user->password = Hash::make($teacher->nip);
        $user->save();
    }

    private function syncStudentUser(Student $student, ?string $previousUsername = null): void
    {
        $user = $previousUsername !== null
            ? User::query()->where('username', $previousUsername)->first()
            : null;

        $user ??= User::query()->firstOrNew(['username' => $student->nis]);
        $user->fill([
            'name' => $student->nama,
            'username' => $student->nis,
            'email' => $student->email ?: $student->nis.'@siakad.local',
            'roles' => [User::ROLE_SISWA],
            'email_verified_at' => now(),
        ]);

        $user->password = Hash::make($student->nis);
        $user->save();
    }

    private function uniqueUserUsernameRule(?int $userIdToIgnore): mixed
    {
        $rule = Rule::unique('users', 'username');

        if ($userIdToIgnore !== null) {
            $rule->ignore($userIdToIgnore);
        }

        return $rule;
    }

    private function uniqueUserEmailRule(?int $userIdToIgnore): mixed
    {
        $rule = Rule::unique('users', 'email');

        if ($userIdToIgnore !== null) {
            $rule->ignore($userIdToIgnore);
        }

        return $rule;
    }

    private function reusableStudentUserId(string $username): ?int
    {
        if ($username === '') {
            return null;
        }

        $user = User::query()->where('username', $username)->first();

        if (! $user?->hasRole(User::ROLE_SISWA)) {
            return null;
        }

        return $user->id;
    }

    private function teacherNameForUser(?User $user): ?string
    {
        if ($user === null) {
            return null;
        }

        return Teacher::query()->where('nip', $user->username)->value('nama')
            ?? $user->name;
    }

    private function applyVisibleClassScope($query, ?User $user, string $column): void
    {
        $classNames = $this->visibleClassNamesForUser($user);

        if ($classNames === null) {
            return;
        }

        if ($classNames === []) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereIn($column, $classNames);
    }

    /**
     * @return list<string>|null
     */
    private function visibleClassNamesForUser(?User $user): ?array
    {
        if ($user === null) {
            return [];
        }

        if ($user->hasRole(User::ROLE_ADMIN)) {
            return null;
        }

        $teacherName = $this->teacherNameForUser($user);

        if ($teacherName === null) {
            return [];
        }

        $classNames = [];

        if ($user->hasRole(User::ROLE_WALI_KELAS)) {
            $activeAcademicYear = $this->activeAcademicYearValue();

            if ($activeAcademicYear === null) {
                return [];
            }

            $classNames = array_merge(
                $classNames,
                SchoolClass::query()
                    ->where('wali_kelas', $teacherName)
                    ->where('tahun_ajaran', $activeAcademicYear)
                    ->pluck('nama')
                    ->all(),
            );
        }

        if ($user->hasRole(User::ROLE_GURU_MAPEL)) {
            $activeAcademicYear = $this->activeAcademicYearValue();

            if ($activeAcademicYear === null) {
                return [];
            }

            $classNames = array_merge(
                $classNames,
                LearningAssignment::query()
                    ->where('guru_pengampu', $teacherName)
                    ->where('tahun_ajaran', $activeAcademicYear)
                    ->pluck('kelas')
                    ->all(),
            );
        }

        return array_values(array_unique(array_filter($classNames)));
    }

    private function refreshSchoolClassStudentCount(?string $className): void
    {
        if (! $className) {
            return;
        }

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

    private function syncAcademicRecordsForStudent(string $previousNis, Student $student): void
    {
        $payload = [
            'student_id' => $student->id,
            'nis' => $student->nis,
            'nama' => $student->nama,
            'kelas' => $student->kelas,
            'tahun_ajaran' => $student->tahun_ajaran,
        ];

        StudentGrade::query()->where('nis', $previousNis)->update($payload);
        AttendanceRecord::query()->where('nis', $previousNis)->update($payload);
        QuranSubmission::query()->where('nis', $previousNis)->update([
            'student_id' => $student->id,
            'nis' => $student->nis,
            'nama' => $student->nama,
            'kelas' => $student->kelas,
        ]);
        StudentNote::query()->where('nis', $previousNis)->update([
            'student_id' => $student->id,
            'nis' => $student->nis,
        ]);
        StudentAchievement::query()->where('nis', $previousNis)->update([
            'student_id' => $student->id,
            'nis' => $student->nis,
        ]);
    }

    private function syncTeacherNameReferences(string $previousName, string $newName): void
    {
        if ($previousName === $newName) {
            return;
        }

        SchoolClass::query()->where('wali_kelas', $previousName)->update(['wali_kelas' => $newName]);
        LearningAssignment::query()->where('guru_pengampu', $previousName)->update(['guru_pengampu' => $newName]);
        StudentGrade::query()->where('guru', $previousName)->update(['guru' => $newName]);
        AttendanceRecord::query()->where('guru', $previousName)->update(['guru' => $newName]);
        QuranSubmission::query()->where('guru', $previousName)->update(['guru' => $newName]);
        StudentNote::query()->where('guru', $previousName)->update(['guru' => $newName]);
        LearningTask::query()->where('guru', $previousName)->update(['guru' => $newName]);
    }

    private function syncClassNameReferences(string $previousName, string $newName): void
    {
        Student::query()->where('kelas', $previousName)->update(['kelas' => $newName]);
        LearningAssignment::query()->where('kelas', $previousName)->update(['kelas' => $newName]);
        StudentGrade::query()->where('kelas', $previousName)->update(['kelas' => $newName]);
        AttendanceRecord::query()->where('kelas', $previousName)->update(['kelas' => $newName]);
        QuranSubmission::query()->where('kelas', $previousName)->update(['kelas' => $newName]);
        ClassAgenda::query()->where('kelas', $previousName)->update(['kelas' => $newName]);
        ClassReminder::query()->where('kelas', $previousName)->update(['kelas' => $newName]);
        LearningTask::query()->where('kelas', $previousName)->update(['kelas' => $newName]);
    }

    private function syncSubjectNameReferences(string $previousName, string $newName): void
    {
        LearningAssignment::query()->where('nama', $previousName)->update(['nama' => $newName]);
        StudentGrade::query()->where('mapel', $previousName)->update(['mapel' => $newName]);
        AttendanceRecord::query()->where('mapel', $previousName)->update(['mapel' => $newName]);
        LearningTask::query()->where('mapel', $previousName)->update(['mapel' => $newName]);
    }

    private function activeAcademicYearValue(): ?string
    {
        $academicYear = AcademicYear::query()
            ->where('status', 'Aktif')
            ->latest('id')
            ->first();

        if ($academicYear === null) {
            return null;
        }

        return trim($academicYear->nama.' '.$academicYear->semester);
    }
}
