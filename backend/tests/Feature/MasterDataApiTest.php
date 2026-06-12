<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\AttendanceRecord;
use App\Models\LearningAssignment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MasterDataApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_master_data_api_requires_authentication(): void
    {
        $this->getJson('/api/students')->assertUnauthorized();
    }

    public function test_authenticated_user_can_read_master_data_from_database(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        Student::query()->create([
            'nis' => 'SIS001',
            'nama' => 'Siswa Test',
            'tahun_ajaran' => 'Tahun Test',
            'kelas' => 'Kelas Test',
            'jenis_kelamin' => 'Laki-laki',
            'tempat_lahir' => 'Bandung',
            'tanggal_lahir' => '2010-01-15',
            'alamat' => 'Jl. Siswa Test',
            'email' => 'siswa.test@example.test',
            'telepon' => '080000000001',
        ]);

        Teacher::query()->create([
            'nip' => 'TCH001',
            'nama' => 'Guru Test',
            'tahun_ajaran' => 'Tahun Test',
            'roles' => ['Guru Mapel'],
            'email' => 'guru.test@example.test',
            'telepon' => '080000000002',
            'status' => 'Aktif',
        ]);

        $this->actingAs($admin)
            ->getJson('/api/students')
            ->assertOk()
            ->assertJsonFragment([
                'nis' => 'SIS001',
                'nama' => 'Siswa Test',
                'tempatLahir' => 'Bandung',
                'tanggalLahir' => '2010-01-15',
                'alamat' => 'Jl. Siswa Test',
            ]);

        $this->actingAs($admin)
            ->getJson('/api/teachers')
            ->assertOk()
            ->assertJsonFragment([
                'nip' => 'TCH001',
                'nama' => 'Guru Test',
            ]);
    }

    public function test_authenticated_user_can_create_update_and_delete_subject(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $createResponse = $this->actingAs($admin)->postJson('/api/subjects', [
            'nama' => 'Pelajaran Test',
            'tahunAjaran' => 'Tahun Test',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('nama', 'Pelajaran Test');

        $subjectId = $createResponse->json('id');

        $this->actingAs($admin)
            ->putJson("/api/subjects/{$subjectId}", [
                'nama' => 'Pelajaran Test Updated',
                'tahunAjaran' => 'Tahun Test',
            ])
            ->assertOk()
            ->assertJsonPath('nama', 'Pelajaran Test Updated');

        $this->actingAs($admin)
            ->deleteJson("/api/subjects/{$subjectId}")
            ->assertOk();

        $this->assertDatabaseMissing('subjects', [
            'id' => $subjectId,
        ]);
    }

    public function test_role_middleware_protects_master_data_mutations(): void
    {
        $guru = User::factory()->create([
            'roles' => [User::ROLE_GURU_MAPEL],
        ]);
        $siswa = User::factory()->create([
            'roles' => [User::ROLE_SISWA],
        ]);

        $this->actingAs($guru)
            ->getJson('/api/students')
            ->assertOk();

        $this->actingAs($guru)
            ->postJson('/api/subjects', [
                'nama' => 'Pelajaran Guru',
                'tahunAjaran' => 'Tahun Test',
            ])
            ->assertForbidden();

        $this->actingAs($siswa)
            ->getJson('/api/students')
            ->assertForbidden();
    }

    public function test_student_account_and_related_records_stay_synced_when_student_is_updated(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        SchoolClass::query()->create([
            'nama' => 'Kelas Lama',
            'tahun_ajaran' => 'Tahun Test',
            'kelompok' => 'Ikhwan',
            'jumlah_siswa' => 0,
        ]);
        SchoolClass::query()->create([
            'nama' => 'Kelas Baru',
            'tahun_ajaran' => 'Tahun Test',
            'kelompok' => 'Ikhwan',
            'jumlah_siswa' => 0,
        ]);

        $createResponse = $this->actingAs($admin)->postJson('/api/students', [
            'nis' => 'SIS001',
            'nama' => 'Siswa Lama',
            'tahunAjaran' => 'Tahun Test',
            'kelas' => 'Kelas Lama',
            'jenisKelamin' => 'Laki-laki',
            'tempatLahir' => 'Bandung',
            'tanggalLahir' => '2010-01-15',
            'alamat' => 'Jl. Lama',
            'email' => 'siswa.lama@example.test',
            'telepon' => '080000000001',
        ]);

        $createResponse->assertCreated();
        $studentId = $createResponse->json('id');

        StudentGrade::query()->create([
            'student_id' => $studentId,
            'nis' => 'SIS001',
            'nama' => 'Siswa Lama',
            'kelas' => 'Kelas Lama',
            'tahun_ajaran' => 'Tahun Test',
            'mapel' => 'Pelajaran Test',
            'jenis_penilaian' => 'UTS',
            'nilai' => 80,
            'tanggal' => '2026-05-02',
        ]);
        AttendanceRecord::query()->create([
            'student_id' => $studentId,
            'nis' => 'SIS001',
            'nama' => 'Siswa Lama',
            'kelas' => 'Kelas Lama',
            'tahun_ajaran' => 'Tahun Test',
            'mapel' => 'Pelajaran Test',
            'tanggal' => '2026-05-02',
            'status' => 'hadir',
        ]);

        $this->assertTrue(Hash::check('SIS001', User::query()->where('username', 'SIS001')->first()?->password));
        $this->assertDatabaseHas('school_classes', [
            'nama' => 'Kelas Lama',
            'jumlah_siswa' => 1,
        ]);

        $this->actingAs($admin)
            ->putJson("/api/students/{$studentId}", [
                'nis' => 'SIS002',
                'nama' => 'Siswa Baru',
                'tahunAjaran' => 'Tahun Test',
                'kelas' => 'Kelas Baru',
                'jenisKelamin' => 'Laki-laki',
                'tempatLahir' => 'Jakarta',
                'tanggalLahir' => '2010-02-20',
                'alamat' => 'Jl. Baru',
                'email' => 'siswa.baru@example.test',
                'telepon' => '080000000002',
            ])
            ->assertOk()
            ->assertJsonPath('nis', 'SIS002')
            ->assertJsonPath('tempatLahir', 'Jakarta')
            ->assertJsonPath('tanggalLahir', '2010-02-20')
            ->assertJsonPath('alamat', 'Jl. Baru');

        $this->assertDatabaseMissing('users', ['username' => 'SIS001']);
        $this->assertTrue(Hash::check('SIS002', User::query()->where('username', 'SIS002')->first()?->password));
        $this->assertDatabaseHas('student_grades', [
            'nis' => 'SIS002',
            'nama' => 'Siswa Baru',
            'kelas' => 'Kelas Baru',
        ]);
        $this->assertDatabaseHas('students', [
            'nis' => 'SIS002',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '2010-02-20',
            'alamat' => 'Jl. Baru',
        ]);
        $this->assertDatabaseHas('attendance_records', [
            'nis' => 'SIS002',
            'nama' => 'Siswa Baru',
            'kelas' => 'Kelas Baru',
        ]);
        $this->assertDatabaseHas('school_classes', [
            'nama' => 'Kelas Lama',
            'jumlah_siswa' => 0,
        ]);
        $this->assertDatabaseHas('school_classes', [
            'nama' => 'Kelas Baru',
            'jumlah_siswa' => 1,
        ]);
    }

    public function test_deleting_student_removes_student_login_account_and_updates_class_count(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        SchoolClass::query()->create([
            'nama' => 'Kelas Delete',
            'tahun_ajaran' => 'Tahun Test',
            'kelompok' => 'Ikhwan',
            'jumlah_siswa' => 0,
        ]);

        $createResponse = $this->actingAs($admin)->postJson('/api/students', [
            'nis' => 'SISDEL001',
            'nama' => 'Siswa Hapus',
            'tahunAjaran' => 'Tahun Test',
            'kelas' => 'Kelas Delete',
            'jenisKelamin' => 'Laki-laki',
            'email' => 'siswa.hapus@example.test',
            'telepon' => '080000000777',
        ]);

        $createResponse->assertCreated();
        $studentId = $createResponse->json('id');

        $this->assertDatabaseHas('students', [
            'id' => $studentId,
            'nis' => 'SISDEL001',
        ]);
        $this->assertDatabaseHas('users', [
            'username' => 'SISDEL001',
        ]);
        $this->assertDatabaseHas('school_classes', [
            'nama' => 'Kelas Delete',
            'jumlah_siswa' => 1,
        ]);

        $this->actingAs($admin)
            ->deleteJson("/api/students/{$studentId}")
            ->assertOk()
            ->assertJsonPath('message', 'Siswa berhasil dihapus.');

        $this->assertDatabaseMissing('students', [
            'id' => $studentId,
        ]);
        $this->assertDatabaseMissing('users', [
            'username' => 'SISDEL001',
        ]);
        $this->assertDatabaseHas('school_classes', [
            'nama' => 'Kelas Delete',
            'jumlah_siswa' => 0,
        ]);
    }

    public function test_admin_can_create_student_when_matching_siswa_user_already_exists(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        User::factory()->create([
            'name' => 'Akun Siswa Lama',
            'username' => 'SIS009',
            'email' => 'sis009@example.test',
            'password' => Hash::make('SIS009'),
            'roles' => [User::ROLE_SISWA],
        ]);

        $this->actingAs($admin)
            ->postJson('/api/students', [
                'nis' => 'SIS009',
                'nama' => 'Siswa Baru',
                'tahunAjaran' => 'Tahun Test',
                'kelas' => 'Kelas Test',
                'jenisKelamin' => 'Laki-laki',
                'email' => 'sis009@example.test',
                'telepon' => '080000000009',
            ])
            ->assertCreated()
            ->assertJsonPath('nis', 'SIS009');

        $this->assertDatabaseHas('students', [
            'nis' => 'SIS009',
            'nama' => 'Siswa Baru',
        ]);
        $this->assertSame(1, User::query()->where('username', 'SIS009')->count());
    }

    public function test_student_telepon_must_be_unique_when_created_or_updated(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $firstStudent = Student::query()->create([
            'nis' => 'SIS010',
            'nama' => 'Siswa Pertama',
            'tahun_ajaran' => 'Tahun Test',
            'kelas' => 'Kelas Test',
            'jenis_kelamin' => 'Laki-laki',
            'email' => 'sis010@example.test',
            'telepon' => '080000000010',
        ]);

        $this->actingAs($admin)
            ->postJson('/api/students', [
                'nis' => 'SIS011',
                'nama' => 'Siswa Kedua',
                'tahunAjaran' => 'Tahun Test',
                'kelas' => 'Kelas Test',
                'jenisKelamin' => 'Perempuan',
                'email' => 'sis011@example.test',
                'telepon' => '080000000010',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['telepon']);

        $this->actingAs($admin)
            ->putJson("/api/students/{$firstStudent->id}", [
                'nis' => 'SIS010',
                'nama' => 'Siswa Pertama',
                'tahunAjaran' => 'Tahun Test',
                'kelas' => 'Kelas Test',
                'jenisKelamin' => 'Laki-laki',
                'email' => 'sis010@example.test',
                'telepon' => '080000000010',
            ])
            ->assertOk();
    }

    public function test_creating_same_school_class_twice_is_idempotent(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $payload = [
            'nama' => '7A',
            'tahunAjaran' => '2026/2027 Genap',
            'kelompok' => 'Ikhwan',
            'waliKelas' => 'Ustadz Test',
            'jumlahSiswa' => 0,
        ];

        $firstResponse = $this->actingAs($admin)
            ->postJson('/api/school-classes', $payload)
            ->assertCreated()
            ->assertJsonPath('nama', '7A');

        $this->actingAs($admin)
            ->postJson('/api/school-classes', $payload)
            ->assertOk()
            ->assertJsonPath('id', $firstResponse->json('id'));

        $this->assertSame(
            1,
            SchoolClass::query()
                ->where('nama', '7A')
                ->where('tahun_ajaran', '2026/2027 Genap')
                ->where('kelompok', 'Ikhwan')
                ->count()
        );
    }

    public function test_creating_same_subject_twice_is_idempotent(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $payload = [
            'nama' => 'Matematika',
            'tahunAjaran' => '2026/2027 Genap',
        ];

        $firstResponse = $this->actingAs($admin)
            ->postJson('/api/subjects', $payload)
            ->assertCreated();

        $this->actingAs($admin)
            ->postJson('/api/subjects', $payload)
            ->assertOk()
            ->assertJsonPath('id', $firstResponse->json('id'));

        $this->assertSame(
            1,
            Subject::query()
                ->where('nama', 'Matematika')
                ->where('tahun_ajaran', '2026/2027 Genap')
                ->count()
        );
    }

    public function test_creating_same_academic_year_twice_is_idempotent(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $payload = [
            'nama' => '2026/2027',
            'semester' => 'Ganjil',
            'tanggalMulai' => '2026-07-01',
            'tanggalSelesai' => '2026-12-20',
            'status' => 'Draft',
        ];

        $firstResponse = $this->actingAs($admin)
            ->postJson('/api/academic-years', $payload)
            ->assertCreated();

        $this->actingAs($admin)
            ->postJson('/api/academic-years', [...$payload, 'status' => 'Aktif'])
            ->assertOk()
            ->assertJsonPath('id', $firstResponse->json('id'))
            ->assertJsonPath('status', 'Aktif');

        $this->assertSame(
            1,
            AcademicYear::query()
                ->where('nama', '2026/2027')
                ->where('semester', 'Ganjil')
                ->count()
        );
    }

    public function test_creating_same_teacher_twice_is_idempotent(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $payload = [
            'nip' => 'TCH777',
            'nama' => 'Guru Idempotent',
            'tahunAjaran' => '2026/2027 Ganjil',
            'role' => ['Guru Mapel'],
            'email' => 'guru.idempotent@example.test',
            'telepon' => '080000000777',
            'status' => 'Aktif',
        ];

        $firstResponse = $this->actingAs($admin)
            ->postJson('/api/teachers', $payload)
            ->assertCreated();

        $this->actingAs($admin)
            ->postJson('/api/teachers', [...$payload, 'nama' => 'Guru Idempotent Updated'])
            ->assertOk()
            ->assertJsonPath('id', $firstResponse->json('id'))
            ->assertJsonPath('nama', 'Guru Idempotent Updated');

        $this->assertSame(1, Teacher::query()->where('nip', 'TCH777')->count());
        $this->assertSame(1, User::query()->where('username', 'TCH777')->count());
    }

    public function test_creating_same_learning_assignment_twice_is_idempotent(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $payload = [
            'nama' => 'Matematika',
            'tahunAjaran' => '2026/2027 Genap',
            'guruPengampu' => 'Guru Test',
            'kelas' => '7A',
            'kelompok' => 'Ikhwan',
        ];

        $firstResponse = $this->actingAs($admin)
            ->postJson('/api/learning-assignments', $payload)
            ->assertCreated();

        $this->actingAs($admin)
            ->postJson('/api/learning-assignments', $payload)
            ->assertOk()
            ->assertJsonPath('id', $firstResponse->json('id'));

        $this->assertSame(
            1,
            LearningAssignment::query()
                ->where('nama', 'Matematika')
                ->where('tahun_ajaran', '2026/2027 Genap')
                ->where('kelas', '7A')
                ->where('kelompok', 'Ikhwan')
                ->count()
        );
    }

    public function test_guru_only_reads_learning_assignments_that_match_their_teacher_profile(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        Teacher::query()->create([
            'nip' => 'TCH100',
            'nama' => 'Guru Satu',
            'tahun_ajaran' => 'Tahun Test',
            'roles' => ['Guru Mapel'],
            'email' => 'guru.satu@test.local',
            'telepon' => '080000000100',
            'status' => 'Aktif',
        ]);

        $guru = User::factory()->create([
            'name' => 'Guru Satu',
            'username' => 'TCH100',
            'email' => 'guru.satu@test.local',
            'roles' => [User::ROLE_GURU_MAPEL],
        ]);

        LearningAssignment::query()->create([
            'nama' => 'Matematika',
            'tahun_ajaran' => 'Tahun Test',
            'guru_pengampu' => 'Guru Satu',
            'kelas' => '7A',
            'kelompok' => 'Ikhwan',
        ]);
        LearningAssignment::query()->create([
            'nama' => 'Bahasa Indonesia',
            'tahun_ajaran' => 'Tahun Test',
            'guru_pengampu' => 'Guru Dua',
            'kelas' => '7B',
            'kelompok' => 'Akhwat',
        ]);
        Subject::query()->create([
            'nama' => 'Matematika',
            'tahun_ajaran' => 'Tahun Test',
        ]);
        Subject::query()->create([
            'nama' => 'Bahasa Indonesia',
            'tahun_ajaran' => 'Tahun Test',
        ]);

        $this->actingAs($guru)
            ->getJson('/api/learning-assignments')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.nama', 'Matematika');

        $this->actingAs($guru)
            ->getJson('/api/subjects')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.nama', 'Matematika');

        $this->actingAs($admin)
            ->getJson('/api/learning-assignments')
            ->assertOk()
            ->assertJsonCount(2);

        $this->actingAs($admin)
            ->getJson('/api/subjects')
            ->assertOk()
            ->assertJsonCount(2);
    }
}
