<?php

namespace Tests\Feature;

use App\Models\ClassAgenda;
use App\Models\ClassReminder;
use App\Models\LearningAssignment;
use App\Models\LearningTask;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentAchievement;
use App\Models\StudentGrade;
use App\Models\StudentNote;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class FrontendFeatureApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_profile_and_password_from_backend(): void
    {
        $user = User::factory()->create([
            'username' => 'profile_admin',
            'password' => Hash::make('profile_admin'),
            'roles' => [User::ROLE_ADMIN],
        ]);

        $this->actingAs($user)
            ->putJson('/api/profile', [
                'nama' => 'Admin Baru',
                'email' => 'admin.baru@example.test',
                'telepon' => '080000000001',
                'alamat' => 'Alamat Test',
                'tanggalLahir' => '2000-01-01',
            ])
            ->assertOk()
            ->assertJsonPath('role', 'admin')
            ->assertJsonPath('username', 'profile_admin')
            ->assertJsonPath('nama', 'Admin Baru')
            ->assertJsonPath('telepon', '080000000001');

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'alamat' => 'Alamat Test',
        ]);

        $photoResponse = $this->actingAs($user)
            ->post('/api/profile/photo', [
                'fotoProfil' => UploadedFile::fake()->create('profile.jpg', 32, 'image/jpeg'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonStructure(['fotoProfil']);

        $firstPhotoUrl = $photoResponse->json('fotoProfil');
        $this->assertStringContainsString('/api/profile/photo-content?v=', $firstPhotoUrl);

        $this->actingAs($user)
            ->get('/api/profile/photo-content')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg');

        $secondPhotoResponse = $this->actingAs($user)
            ->post('/api/profile/photo', [
                'fotoProfil' => UploadedFile::fake()->create('profile-baru.png', 32, 'image/png'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonStructure(['fotoProfil']);

        $this->assertNotSame($firstPhotoUrl, $secondPhotoResponse->json('fotoProfil'));

        $this->actingAs($user)
            ->get('/api/profile/photo-content')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'currentPassword' => 'profile_admin',
                'newPassword' => 'password-baru',
                'confirmPassword' => 'password-baru',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('password-baru', $user->fresh()->password));
    }

    public function test_dual_role_guru_can_update_profile_photo_and_password(): void
    {
        Teacher::query()->create([
            'nip' => 'TCH500',
            'nama' => 'Guru Dual',
            'tahun_ajaran' => 'Tahun Test',
            'roles' => ['Guru Mapel', 'Wali Kelas'],
            'email' => 'guru.dual@example.test',
            'telepon' => '080000000500',
            'status' => 'Aktif',
        ]);

        $user = User::factory()->create([
            'name' => 'Guru Dual',
            'username' => 'TCH500',
            'email' => 'guru.dual@example.test',
            'password' => Hash::make('TCH500'),
            'roles' => [User::ROLE_GURU_MAPEL, User::ROLE_WALI_KELAS],
        ]);

        $this->actingAs($user)
            ->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('role', 'guru')
            ->assertJsonPath('guruAccess', ['Guru Mapel', 'Wali Kelas'])
            ->assertJsonPath('nama', 'Guru Dual');

        $this->actingAs($user)
            ->putJson('/api/profile', [
                'nama' => 'Guru Dual Baru',
                'email' => 'guru.dual.baru@example.test',
                'telepon' => '080000000501',
                'alamat' => 'Alamat Guru',
                'tanggalLahir' => '1990-01-01',
            ])
            ->assertOk()
            ->assertJsonPath('nama', 'Guru Dual Baru')
            ->assertJsonPath('telepon', '080000000501');

        $this->assertDatabaseHas('teachers', [
            'nip' => 'TCH500',
            'nama' => 'Guru Dual Baru',
            'email' => 'guru.dual.baru@example.test',
            'telepon' => '080000000501',
        ]);

        $photoResponse = $this->actingAs($user)
            ->post('/api/profile/photo', [
                'fotoProfil' => UploadedFile::fake()->create('guru-dual.png', 24, 'image/png'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('role', 'guru')
            ->assertJsonStructure(['fotoProfil']);

        $this->assertStringContainsString('/api/profile/photo-content?v=', $photoResponse->json('fotoProfil'));

        $this->actingAs($user)
            ->get('/api/profile/photo-content')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'currentPassword' => 'TCH500',
                'newPassword' => 'password-guru-dual',
                'confirmPassword' => 'password-guru-dual',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('password-guru-dual', $user->fresh()->password));
    }

    /**
     * @param  list<string>  $userRoles
     * @param  list<string>|null  $teacherRoles
     */
    #[DataProvider('profilePhotoRoleProvider')]
    public function test_profile_photo_upload_works_for_every_app_role(
        string $username,
        array $userRoles,
        ?array $teacherRoles = null,
    ): void {
        if ($teacherRoles !== null) {
            Teacher::query()->create([
                'nip' => $username,
                'nama' => 'Guru Foto '.$username,
                'tahun_ajaran' => 'Tahun Test',
                'roles' => $teacherRoles,
                'email' => strtolower($username).'@example.test',
                'telepon' => '08000000'.$username,
                'status' => 'Aktif',
            ]);
        }

        if (in_array(User::ROLE_SISWA, $userRoles, true)) {
            Student::query()->create([
                'nis' => $username,
                'nama' => 'Siswa Foto '.$username,
                'tahun_ajaran' => 'Tahun Test',
                'kelas' => 'Kelas Test',
                'jenis_kelamin' => 'Laki-laki',
                'email' => strtolower($username).'@example.test',
                'telepon' => '08000000'.$username,
            ]);
        }

        $user = User::factory()->create([
            'name' => 'User Foto '.$username,
            'username' => $username,
            'email' => strtolower($username).'@user.test',
            'roles' => $userRoles,
        ]);

        $photoResponse = $this->actingAs($user)
            ->post('/api/profile/photo', [
                'fotoProfil' => UploadedFile::fake()->create($username.'.webp', 32, 'image/webp'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonStructure(['fotoProfil']);

        $this->assertStringContainsString('/api/profile/photo-content?v=', $photoResponse->json('fotoProfil'));

        $this->actingAs($user)
            ->get('/api/profile/photo-content')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/webp');
    }

    /**
     * @return array<string, array{0: string, 1: list<string>, 2?: list<string>|null}>
     */
    public static function profilePhotoRoleProvider(): array
    {
        return [
            'admin' => ['PHOTOADMIN', [User::ROLE_ADMIN]],
            'siswa' => ['PHOTOSISWA', [User::ROLE_SISWA]],
            'guru mapel' => ['PHOTOMAPEL', [User::ROLE_GURU_MAPEL], ['Guru Mapel']],
            'wali kelas' => ['PHOTOWALI', [User::ROLE_WALI_KELAS], ['Wali Kelas']],
            'guru dual role' => [
                'PHOTODUAL',
                [User::ROLE_GURU_MAPEL, User::ROLE_WALI_KELAS],
                ['Guru Mapel', 'Wali Kelas'],
            ],
        ];
    }

    public function test_admin_can_import_students_from_csv(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        SchoolClass::query()->create([
            'nama' => '7A',
            'tahun_ajaran' => '2026/2027 Genap',
            'kelompok' => 'Ikhwan',
            'jumlah_siswa' => 0,
        ]);

        $file = UploadedFile::fake()->createWithContent(
            'students.csv',
            "nis,nama,tahunAjaran,kelas,jenisKelamin,tempatLahir,tanggalLahir,alamat,email,telepon\n".
            "SIS100,Siswa Import,2026/2027 Genap,7A,Laki-laki,Bandung,2010-01-15,Jl. Import,sis100@example.test,080000000100\n"
        );

        $this->actingAs($admin)
            ->post('/api/students/import', ['file' => $file], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('imported', 1)
            ->assertJsonPath('importedStudents.0.nis', 'SIS100')
            ->assertJsonPath('students.0.nis', 'SIS100');

        $this->assertDatabaseHas('students', [
            'nis' => 'SIS100',
            'nama' => 'Siswa Import',
            'tempat_lahir' => 'Bandung',
            'tanggal_lahir' => '2010-01-15',
            'alamat' => 'Jl. Import',
        ]);
        $this->assertDatabaseHas('users', [
            'username' => 'SIS100',
        ]);
        $this->assertDatabaseHas('school_classes', [
            'nama' => '7A',
            'jumlah_siswa' => 1,
        ]);
    }

    public function test_imported_student_uses_fallback_login_email_when_email_is_already_used(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);
        User::factory()->create([
            'username' => 'existing_user',
            'email' => 'duplicate@example.test',
        ]);

        SchoolClass::query()->create([
            'nama' => '7C',
            'tahun_ajaran' => '2026/2027 Genap',
            'kelompok' => 'Ikhwan',
            'jumlah_siswa' => 0,
        ]);

        $file = UploadedFile::fake()->createWithContent(
            'students.csv',
            "nis,nama,tahunAjaran,kelas,jenisKelamin,email,telepon\n".
            "SIS102,Siswa Duplikat Email,2026/2027 Genap,7C,Laki-laki,duplicate@example.test,080000000102\n"
        );

        $this->actingAs($admin)
            ->post('/api/students/import', ['file' => $file], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('imported', 1)
            ->assertJsonPath('importedStudents.0.nis', 'SIS102');

        $this->assertDatabaseHas('students', [
            'nis' => 'SIS102',
            'email' => 'duplicate@example.test',
        ]);
        $this->assertDatabaseHas('users', [
            'username' => 'SIS102',
            'email' => 'sis102@siakad.local',
        ]);
    }

    public function test_admin_can_import_students_from_xlsx(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        SchoolClass::query()->create([
            'nama' => '7B',
            'tahun_ajaran' => '2026/2027 Genap',
            'kelompok' => 'Akhwat',
            'jumlah_siswa' => 0,
        ]);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['nis', 'nama', 'tahunAjaran', 'kelas', 'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'alamat', 'email', 'telepon'],
            ['SIS101', 'Siswa Excel', '2026/2027 Genap', '7B', 'Perempuan', 'Jakarta', '2011-02-16', 'Jl. Excel', 'sis101@example.test', '080000000101'],
        ]);

        $path = tempnam(sys_get_temp_dir(), 'students-import-').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        try {
            $file = new UploadedFile(
                $path,
                'students.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                null,
                true,
            );

            $this->actingAs($admin)
                ->post('/api/students/import', ['file' => $file], ['Accept' => 'application/json'])
                ->assertOk()
                ->assertJsonPath('imported', 1)
                ->assertJsonPath('students.0.nis', 'SIS101');
        } finally {
            if (file_exists($path)) {
                unlink($path);
            }
        }

        $this->assertDatabaseHas('students', [
            'nis' => 'SIS101',
            'nama' => 'Siswa Excel',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '2011-02-16',
            'alamat' => 'Jl. Excel',
        ]);
        $this->assertDatabaseHas('school_classes', [
            'nama' => '7B',
            'jumlah_siswa' => 1,
        ]);
    }

    public function test_student_insights_and_rapor_download_use_database_data(): void
    {
        $studentUser = User::factory()->create([
            'username' => 'SIS001',
            'roles' => [User::ROLE_SISWA],
        ]);

        $student = Student::query()->create([
            'nis' => 'SIS001',
            'nama' => 'Siswa Satu',
            'tahun_ajaran' => '2026/2027 Genap',
            'kelas' => '7A',
            'jenis_kelamin' => 'Laki-laki',
        ]);
        Student::query()->create([
            'nis' => 'SIS002',
            'nama' => 'Siswa Dua',
            'tahun_ajaran' => '2026/2027 Genap',
            'kelas' => '7A',
            'jenis_kelamin' => 'Laki-laki',
        ]);

        StudentGrade::query()->create([
            'student_id' => $student->id,
            'nis' => 'SIS001',
            'nama' => 'Siswa Satu',
            'kelas' => '7A',
            'tahun_ajaran' => '2026/2027 Genap',
            'mapel' => 'Matematika',
            'jenis_penilaian' => 'UTS',
            'nilai' => 95,
            'tanggal' => '2026-05-07',
        ]);
        StudentGrade::query()->create([
            'nis' => 'SIS002',
            'nama' => 'Siswa Dua',
            'kelas' => '7A',
            'tahun_ajaran' => '2026/2027 Genap',
            'mapel' => 'Matematika',
            'jenis_penilaian' => 'UTS',
            'nilai' => 80,
            'tanggal' => '2026-05-07',
        ]);
        StudentNote::query()->create([
            'student_id' => $student->id,
            'nis' => 'SIS001',
            'guru' => 'Guru Test',
            'catatan' => 'Catatan dari database.',
            'tanggal' => '2026-05-07',
        ]);
        StudentAchievement::query()->create([
            'student_id' => $student->id,
            'nis' => 'SIS001',
            'judul' => 'Juara Kelas',
            'tanggal' => '2026-05-07',
        ]);

        $this->actingAs($studentUser)
            ->getJson('/api/student-insights')
            ->assertOk()
            ->assertJsonPath('rank', 1)
            ->assertJsonPath('classSize', 2)
            ->assertJsonPath('notes.0.catatan', 'Catatan dari database.')
            ->assertJsonPath('achievements.0.judul', 'Juara Kelas');

        $this->actingAs($studentUser)
            ->get('/api/reports/student/rapor')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_class_dashboard_schedule_and_learning_tasks_use_backend_data(): void
    {
        $teacherUser = User::factory()->create([
            'username' => 'TCH001',
            'roles' => [User::ROLE_GURU_MAPEL, User::ROLE_WALI_KELAS],
        ]);

        Teacher::query()->create([
            'nip' => 'TCH001',
            'nama' => 'Guru Test',
            'tahun_ajaran' => '2026/2027 Genap',
            'roles' => ['Guru Mapel', 'Wali Kelas'],
            'status' => 'Aktif',
        ]);
        SchoolClass::query()->create([
            'nama' => '7A',
            'tahun_ajaran' => '2026/2027 Genap',
            'kelompok' => 'Ikhwan',
            'wali_kelas' => 'Guru Test',
            'jumlah_siswa' => 0,
        ]);
        LearningAssignment::query()->create([
            'nama' => 'Matematika',
            'tahun_ajaran' => '2026/2027 Genap',
            'guru_pengampu' => 'Guru Test',
            'kelas' => '7A',
            'kelompok' => 'Ikhwan',
        ]);
        ClassAgenda::query()->create([
            'kelas' => '7A',
            'tanggal' => now()->toDateString(),
            'judul' => 'Agenda dari database',
        ]);
        ClassReminder::query()->create([
            'kelas' => '7A',
            'tanggal' => now()->toDateString(),
            'judul' => 'Pengingat dari database',
        ]);
        LearningTask::query()->create([
            'judul' => 'Tugas dari database',
            'kelas' => '7A',
            'mapel' => 'Matematika',
            'guru' => 'Guru Test',
            'status' => 'Aktif',
        ]);

        $this->actingAs($teacherUser)
            ->getJson('/api/class-dashboard')
            ->assertOk()
            ->assertJsonPath('kelas', '7A')
            ->assertJsonPath('agendaToday.0.judul', 'Agenda dari database')
            ->assertJsonPath('reminders.0.judul', 'Pengingat dari database');

        $this->actingAs($teacherUser)
            ->getJson('/api/learning-tasks')
            ->assertOk()
            ->assertJsonPath('0.judul', 'Tugas dari database');

        $this->actingAs($teacherUser)
            ->getJson('/api/schedule/today')
            ->assertOk()
            ->assertJsonPath('0.nama', 'Matematika');
    }
}
