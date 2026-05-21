<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\AttendanceRecord;
use App\Models\LearningAssignment;
use App\Models\QuranSubmission;
use App\Models\Teacher;
use App\Models\StudentGrade;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicActivityApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_academic_activity_lists_are_empty_when_database_has_no_data(): void
    {
        $user = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $this->actingAs($user)->getJson('/api/grades')->assertOk()->assertExactJson([]);
        $this->actingAs($user)->getJson('/api/attendance-records')->assertOk()->assertExactJson([]);
        $this->actingAs($user)->getJson('/api/quran-submissions')->assertOk()->assertExactJson([]);
        $this->actingAs($user)->getJson('/api/assessment-setting')->assertOk()->assertExactJson([
            'bobot' => [],
            'gradeRanges' => [],
        ]);

        $this->actingAs($user)
            ->getJson('/api/dashboard-summary')
            ->assertOk()
            ->assertJsonPath('admin.totalSiswa', 0)
            ->assertJsonPath('admin.totalGuru', 0)
            ->assertJsonPath('admin.presensiHariIni', null)
            ->assertJsonPath('admin.rataRataNilai', null)
            ->assertJsonPath('siswa.nilaiTerbaru', [])
            ->assertJsonPath('siswa.presensiTerbaru', [])
            ->assertJsonPath('siswa.quranTerbaru', []);
    }

    public function test_authenticated_user_can_crud_grade_attendance_and_quran_submission(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $gradeResponse = $this->actingAs($admin)->postJson('/api/grades', [
            'nis' => 'SIS001',
            'nama' => 'Siswa Test',
            'mapel' => 'Pelajaran Test',
            'jenis' => 'UTS',
            'nilai' => 88,
            'guru' => 'Guru Test',
            'tanggal' => '2026-05-02',
        ]);

        $gradeResponse
            ->assertCreated()
            ->assertJsonPath('nis', 'SIS001')
            ->assertJsonPath('grade', 'B');

        $gradeId = $gradeResponse->json('id');

        $this->actingAs($admin)
            ->putJson("/api/grades/{$gradeId}", [
                'nis' => 'SIS001',
                'nama' => 'Siswa Test',
                'mapel' => 'Pelajaran Test',
                'jenis' => 'UTS',
                'nilai' => 92,
                'guru' => 'Guru Test',
                'tanggal' => '2026-05-02',
            ])
            ->assertOk()
            ->assertJsonPath('grade', 'A');

        $attendanceResponse = $this->actingAs($admin)->postJson('/api/attendance-records', [
            'nis' => 'SIS001',
            'nama' => 'Siswa Test',
            'mapel' => 'Pelajaran Test',
            'tanggal' => '2026-05-02',
            'status' => 'hadir',
            'waktu' => '07:15',
            'guru' => 'Guru Test',
        ]);

        $attendanceResponse
            ->assertCreated()
            ->assertJsonPath('statusCode', 'H');

        $attendanceId = $attendanceResponse->json('id');

        $aprilAttendanceResponse = $this->actingAs($admin)->postJson('/api/attendance-records', [
            'nis' => 'SIS001',
            'nama' => 'Siswa Test',
            'mapel' => 'Pelajaran Test',
            'tanggal' => '2026-04-30',
            'status' => 'izin',
            'guru' => 'Guru Test',
        ]);

        $aprilAttendanceId = $aprilAttendanceResponse->json('id');

        $this->actingAs($admin)
            ->getJson('/api/attendance-records?bulan=Mei%202026')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $attendanceId);

        $quranResponse = $this->actingAs($admin)->postJson('/api/quran-submissions', [
            'nis' => 'SIS001',
            'nama' => 'Siswa Test',
            'tanggal' => '2026-05-02',
            'surah' => 'Surah Test',
            'ayatMulai' => 1,
            'ayatSelesai' => 10,
            'penilaian' => 'Lancar',
            'progress' => 5,
            'guru' => 'Guru Test',
        ]);

        $quranResponse
            ->assertCreated()
            ->assertJsonPath('progress', 5);

        $quranId = $quranResponse->json('id');

        $this->actingAs($admin)->deleteJson("/api/grades/{$gradeId}")->assertOk();
        $this->actingAs($admin)->deleteJson("/api/attendance-records/{$attendanceId}")->assertOk();
        $this->actingAs($admin)->deleteJson("/api/attendance-records/{$aprilAttendanceId}")->assertOk();
        $this->actingAs($admin)->deleteJson("/api/quran-submissions/{$quranId}")->assertOk();

        $this->assertDatabaseMissing('student_grades', ['id' => $gradeId]);
        $this->assertDatabaseMissing('attendance_records', ['id' => $attendanceId]);
        $this->assertDatabaseMissing('attendance_records', ['id' => $aprilAttendanceId]);
        $this->assertDatabaseMissing('quran_submissions', ['id' => $quranId]);
    }

    public function test_creating_same_grade_twice_updates_existing_record(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $payload = [
            'nis' => 'SIS001',
            'nama' => 'Siswa Test',
            'mapel' => 'Pelajaran Test',
            'jenis' => 'UTS',
            'nilai' => 80,
            'guru' => 'Guru Test',
            'tanggal' => '2026-05-02',
        ];

        $firstResponse = $this->actingAs($admin)
            ->postJson('/api/grades', $payload)
            ->assertCreated()
            ->assertJsonPath('nilai', 80);

        $this->actingAs($admin)
            ->postJson('/api/grades', [...$payload, 'nilai' => 90])
            ->assertOk()
            ->assertJsonPath('id', $firstResponse->json('id'))
            ->assertJsonPath('nilai', 90)
            ->assertJsonPath('grade', 'A');

        $this->assertSame(
            1,
            StudentGrade::query()
                ->where('nis', 'SIS001')
                ->where('mapel', 'Pelajaran Test')
                ->where('jenis_penilaian', 'UTS')
                ->whereDate('tanggal', '2026-05-02')
                ->count()
        );
    }

    public function test_creating_same_quran_submission_twice_updates_existing_record(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        $payload = [
            'nis' => 'SIS001',
            'nama' => 'Siswa Test',
            'kelas' => '7A',
            'tanggal' => '2026-05-02',
            'surah' => 'Al-Baqarah',
            'ayatMulai' => 1,
            'ayatSelesai' => 10,
            'penilaian' => 'Kurang Lancar',
            'progress' => 2,
            'guru' => 'Guru Test',
        ];

        $firstResponse = $this->actingAs($admin)
            ->postJson('/api/quran-submissions', $payload)
            ->assertCreated()
            ->assertJsonPath('progress', 2);

        $this->actingAs($admin)
            ->postJson('/api/quran-submissions', [...$payload, 'penilaian' => 'Lancar', 'progress' => 3])
            ->assertOk()
            ->assertJsonPath('id', $firstResponse->json('id'))
            ->assertJsonPath('penilaian', 'Lancar')
            ->assertJsonPath('progress', 3);

        $this->assertSame(
            1,
            QuranSubmission::query()
                ->where('nis', 'SIS001')
                ->whereDate('tanggal', '2026-05-02')
                ->where('surah', 'Al-Baqarah')
                ->where('ayat_mulai', 1)
                ->where('ayat_selesai', 10)
                ->count()
        );
    }

    public function test_guru_name_is_inferred_when_guru_user_inputs_grade_and_attendance(): void
    {
        Teacher::query()->create([
            'nip' => 'TCH200',
            'nama' => 'Guru Mapel Test',
            'tahun_ajaran' => 'Tahun Test',
            'roles' => ['Guru Mapel'],
            'email' => 'guru.mapel@test.local',
            'telepon' => '080000000200',
            'status' => 'Aktif',
        ]);

        $guru = User::factory()->create([
            'name' => 'Guru Mapel Test',
            'username' => 'TCH200',
            'email' => 'guru.mapel@test.local',
            'roles' => [User::ROLE_GURU_MAPEL],
        ]);

        $this->actingAs($guru)
            ->postJson('/api/grades', [
                'nis' => 'SIS001',
                'nama' => 'Siswa Test',
                'kelas' => '7A',
                'tahunAjaran' => 'Tahun Test',
                'mapel' => 'Matematika',
                'jenis' => 'UTS',
                'nilai' => 88,
                'tanggal' => '2026-05-02',
            ])
            ->assertCreated()
            ->assertJsonPath('guru', 'Guru Mapel Test');

        $this->actingAs($guru)
            ->postJson('/api/attendance-records', [
                'nis' => 'SIS001',
                'nama' => 'Siswa Test',
                'kelas' => '7A',
                'tahunAjaran' => 'Tahun Test',
                'mapel' => 'Matematika',
                'tanggal' => '2026-05-02',
                'status' => 'hadir',
            ])
            ->assertCreated()
            ->assertJsonPath('guru', 'Guru Mapel Test');
    }

    public function test_attendance_records_can_be_filtered_by_guru(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        AttendanceRecord::query()->create([
            'nis' => 'SIS001',
            'nama' => 'Siswa Satu',
            'kelas' => '7A',
            'tahun_ajaran' => 'Tahun Test',
            'mapel' => 'Matematika',
            'tanggal' => '2026-05-02',
            'status' => 'hadir',
            'guru' => 'Guru Satu',
        ]);
        AttendanceRecord::query()->create([
            'nis' => 'SIS002',
            'nama' => 'Siswa Dua',
            'kelas' => '7B',
            'tahun_ajaran' => 'Tahun Test',
            'mapel' => 'IPA',
            'tanggal' => '2026-05-02',
            'status' => 'sakit',
            'guru' => 'Guru Dua',
        ]);

        $this->actingAs($admin)
            ->getJson('/api/attendance-records?guru=Guru%20Satu')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.guru', 'Guru Satu');
    }

    public function test_attendance_records_can_be_filtered_to_current_guru(): void
    {
        Teacher::query()->create([
            'nip' => 'TCH201',
            'nama' => 'Guru Mine',
            'tahun_ajaran' => 'Tahun Test',
            'roles' => ['Guru Mapel'],
            'email' => 'guru.mine@test.local',
            'telepon' => '080000000201',
            'status' => 'Aktif',
        ]);

        $guru = User::factory()->create([
            'name' => 'Guru Mine',
            'username' => 'TCH201',
            'email' => 'guru.mine@test.local',
            'roles' => [User::ROLE_GURU_MAPEL],
        ]);

        AttendanceRecord::query()->create([
            'nis' => 'SIS001',
            'nama' => 'Siswa Satu',
            'kelas' => '7A',
            'tahun_ajaran' => 'Tahun Test',
            'mapel' => 'Matematika',
            'tanggal' => '2026-05-02',
            'status' => 'hadir',
            'guru' => 'Guru Mine',
        ]);
        AttendanceRecord::query()->create([
            'nis' => 'SIS002',
            'nama' => 'Siswa Dua',
            'kelas' => '7B',
            'tahun_ajaran' => 'Tahun Test',
            'mapel' => 'IPA',
            'tanggal' => '2026-05-02',
            'status' => 'sakit',
            'guru' => 'Guru Lain',
        ]);

        $this->actingAs($guru)
            ->getJson('/api/attendance-records?mine=1')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.guru', 'Guru Mine');
    }

    public function test_grade_response_uses_learning_assignment_guru_when_grade_guru_is_empty(): void
    {
        $admin = User::factory()->create([
            'roles' => [User::ROLE_ADMIN],
        ]);

        LearningAssignment::query()->create([
            'nama' => 'Matematika',
            'tahun_ajaran' => 'Tahun Test',
            'guru_pengampu' => 'Guru Relasi',
            'kelas' => '7A',
            'kelompok' => 'Ikhwan',
        ]);

        StudentGrade::query()->create([
            'nis' => 'SIS001',
            'nama' => 'Siswa Test',
            'kelas' => '7A',
            'tahun_ajaran' => 'Tahun Test',
            'mapel' => 'Matematika',
            'jenis_penilaian' => 'UTS',
            'nilai' => 90,
            'tanggal' => '2026-05-02',
            'guru' => null,
        ]);

        $this->actingAs($admin)
            ->getJson('/api/grades')
            ->assertOk()
            ->assertJsonPath('0.guru', 'Guru Relasi');
    }
}
