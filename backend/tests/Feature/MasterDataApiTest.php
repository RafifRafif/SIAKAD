<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\GradeWeight;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MasterDataApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_store_creates_linked_user(): void
    {
        $academicYear = AcademicYear::create([
            'name' => '2025/2026',
            'semester' => 'Genap',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/students', [
            'academic_year_id' => $academicYear->id,
            'nis' => '2024005',
            'name' => 'Abdullah Rahman',
            'gender' => 'Laki-laki',
            'email' => 'abdullah@example.com',
            'phone' => '08123456793',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.nis', '2024005')
            ->assertJsonPath('data.name', 'Abdullah Rahman')
            ->assertJsonPath('login_credentials.username', '2024005')
            ->assertJsonPath('login_credentials.password', '2024005')
            ->assertJsonPath('login_credentials.role', 'siswa');

        $user = User::where('username', '2024005')->first();

        $this->assertNotNull($user);
        $this->assertSame('siswa', $user->role);
        $this->assertTrue(Hash::check('2024005', $user->password));
    }

    public function test_student_update_syncs_user_identity_and_password(): void
    {
        $studentUser = User::create([
            'name' => 'Siti Nurhaliza',
            'username' => '2024002',
            'email' => 'siti@example.com',
            'phone' => '08111',
            'role' => 'siswa',
            'password' => '2024002',
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'nis' => '2024002',
            'name' => 'Siti Nurhaliza',
            'gender' => 'Perempuan',
            'email' => 'siti@example.com',
            'phone' => '08111',
        ]);

        $response = $this->putJson("/api/v1/students/{$student->id}", [
            'nis' => '2024999',
            'name' => 'Siti Updated',
            'gender' => 'Perempuan',
            'email' => 'siti.updated@example.com',
            'phone' => '08999',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.nis', '2024999')
            ->assertJsonPath('data.name', 'Siti Updated')
            ->assertJsonPath('login_credentials.username', '2024999')
            ->assertJsonPath('login_credentials.password', '2024999')
            ->assertJsonPath('login_credentials.role', 'siswa');

        $studentUser->refresh();

        $this->assertSame('2024999', $studentUser->username);
        $this->assertSame('Siti Updated', $studentUser->name);
        $this->assertSame('siti.updated@example.com', $studentUser->email);
        $this->assertSame('08999', $studentUser->phone);
        $this->assertTrue(Hash::check('2024999', $studentUser->password));
    }

    public function test_teacher_update_syncs_user_role_and_identity(): void
    {
        $teacherUser = User::create([
            'name' => 'Ustadz Ahmad Fauzi',
            'username' => 'NIP001',
            'email' => 'ahmad@example.com',
            'phone' => '08123',
            'role' => 'guru-mapel',
            'password' => 'NIP001',
        ]);

        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'nip' => 'NIP001',
            'name' => 'Ustadz Ahmad Fauzi',
            'roles' => ['Guru Mapel'],
            'email' => 'ahmad@example.com',
            'phone' => '08123',
            'status' => 'Aktif',
        ]);

        $response = $this->putJson("/api/v1/teachers/{$teacher->id}", [
            'nip' => 'NIP001A',
            'name' => 'Ustadz Ahmad Update',
            'roles' => ['Wali Kelas', 'Guru Mapel'],
            'email' => 'ahmad.update@example.com',
            'phone' => '08999',
            'status' => 'Aktif',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.nip', 'NIP001A')
            ->assertJsonPath('data.name', 'Ustadz Ahmad Update')
            ->assertJsonPath('data.user.role', 'guru-kelas')
            ->assertJsonPath('login_credentials.username', 'NIP001A')
            ->assertJsonPath('login_credentials.password', 'NIP001A')
            ->assertJsonPath('login_credentials.role', 'guru-kelas');

        $teacherUser->refresh();

        $this->assertSame('NIP001A', $teacherUser->username);
        $this->assertSame('Ustadz Ahmad Update', $teacherUser->name);
        $this->assertSame('ahmad.update@example.com', $teacherUser->email);
        $this->assertSame('guru-kelas', $teacherUser->role);
        $this->assertTrue(Hash::check('NIP001A', $teacherUser->password));
    }

    public function test_grade_weight_total_must_equal_one_hundred(): void
    {
        $response = $this->postJson('/api/v1/grade-weights', [
            'title' => 'Bobot Invalid',
            'knowledge_weight' => 40,
            'skill_weight' => 40,
            'attitude_weight' => 10,
        ]);

        $response->assertStatus(422)->assertJsonPath('message', 'Total bobot penilaian harus 100.');

        $this->assertDatabaseCount((new GradeWeight())->getTable(), 0);
    }

    public function test_academic_year_activation_deactivates_previous_active_year(): void
    {
        $first = AcademicYear::create([
            'name' => '2025/2026',
            'semester' => 'Genap',
            'status' => 'Aktif',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/academic-years', [
            'name' => '2026/2027',
            'semester' => 'Ganjil',
            'start_date' => '2026-07-13',
            'end_date' => '2026-12-19',
            'status' => 'Aktif',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.status', 'Aktif')
            ->assertJsonPath('data.start_date', '2026-07-13T00:00:00.000000Z')
            ->assertJsonPath('data.end_date', '2026-12-19T00:00:00.000000Z');

        $this->assertFalse($first->fresh()->is_active);
        $this->assertSame('Arsip', $first->fresh()->status);
        $this->assertDatabaseHas('academic_years', [
            'name' => '2026/2027',
            'semester' => 'Ganjil',
            'start_date' => '2026-07-13 00:00:00',
            'end_date' => '2026-12-19 00:00:00',
            'status' => 'Aktif',
            'is_active' => true,
        ]);
    }

    public function test_school_class_store_resolves_homeroom_teacher_by_name(): void
    {
        $teacherUser = User::create([
            'name' => 'Ustadzah Siti Nurhaliza',
            'username' => 'NIP002',
            'role' => 'guru-kelas',
            'password' => 'NIP002',
        ]);

        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'nip' => 'NIP002',
            'name' => 'Ustadzah Siti Nurhaliza',
            'roles' => ['Wali Kelas'],
            'status' => 'Aktif',
        ]);

        $response = $this->postJson('/api/v1/classes', [
            'name' => 'X-A',
            'level' => 'X',
            'group_type' => 'Akhwat',
            'homeroom_teacher_name' => 'Ustadzah Siti Nurhaliza',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.group_type', 'Akhwat')
            ->assertJsonPath('data.homeroom_teacher_id', $teacher->id)
            ->assertJsonPath('data.homeroom_teacher.name', 'Ustadzah Siti Nurhaliza');

        $this->assertDatabaseHas((new SchoolClass())->getTable(), [
            'name' => 'X-A',
            'group_type' => 'Akhwat',
            'homeroom_teacher_id' => $teacher->id,
            'homeroom_teacher_name' => 'Ustadzah Siti Nurhaliza',
        ]);
    }
}
