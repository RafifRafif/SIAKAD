<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    private const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnR6i8AAAAASUVORK5CYII=';

    public function test_user_can_login_with_username(): void
    {
        $user = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'email' => 'admin@example.com',
            'role' => 'admin',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.username', 'admin')
            ->assertJsonPath('data.role', 'admin')
            ->assertJsonStructure([
                'data' => [
                    'dashboard_context' => [
                        'total_students',
                        'total_teachers',
                        'total_classes',
                        'total_subjects',
                        'grade_weight_count',
                    ],
                ],
            ]);
    }

    public function test_me_returns_student_profile_with_relations(): void
    {
        $academicYear = AcademicYear::create([
            'name' => '2025/2026',
            'semester' => 'Genap',
            'is_active' => true,
        ]);

        $schoolClass = SchoolClass::create([
            'academic_year_id' => $academicYear->id,
            'name' => 'X-A',
            'level' => 'X',
            'homeroom_teacher_name' => 'Ustadzah Siti',
            'capacity' => 36,
        ]);

        $user = User::create([
            'name' => 'Ahmad Fauzi',
            'username' => '2024001',
            'email' => 'ahmad@example.com',
            'role' => 'siswa',
            'password' => '2024001',
        ]);

        Student::create([
            'user_id' => $user->id,
            'academic_year_id' => $academicYear->id,
            'class_id' => $schoolClass->id,
            'nis' => '2024001',
            'name' => 'Ahmad Fauzi',
            'gender' => 'Laki-laki',
            'email' => 'ahmad@example.com',
            'phone' => '08123',
        ]);

        $response = $this->getJson('/api/v1/auth/me?username=2024001');

        $response
            ->assertOk()
            ->assertJsonPath('data.username', '2024001')
            ->assertJsonPath('data.student.nis', '2024001')
            ->assertJsonPath('data.student.class.name', 'X-A')
            ->assertJsonPath('data.student.academic_year.name', '2025/2026');
    }

    public function test_update_profile_updates_linked_student_and_photo(): void
    {
        Storage::fake('public');

        $user = User::create([
            'name' => 'Siti Nurhaliza',
            'username' => '2024002',
            'email' => 'siti@example.com',
            'phone' => '081111',
            'role' => 'siswa',
            'password' => '2024002',
        ]);

        Student::create([
            'user_id' => $user->id,
            'nis' => '2024002',
            'name' => 'Siti Nurhaliza',
            'gender' => 'Perempuan',
            'email' => 'siti@example.com',
            'phone' => '081111',
        ]);

        $response = $this->post('/api/v1/auth/profile', [
            'username' => '2024002',
            'name' => 'Siti Updated',
            'email' => 'siti.updated@example.com',
            'phone' => '082222',
            'profile_photo' => UploadedFile::fake()->createWithContent(
                'avatar.png',
                base64_decode(self::TINY_PNG)
            ),
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Siti Updated')
            ->assertJsonPath('data.student.name', 'Siti Updated')
            ->assertJsonPath('data.student.email', 'siti.updated@example.com')
            ->assertJsonPath('data.student.phone', '082222');

        $user->refresh();

        $this->assertNotNull($user->profile_photo_path);
        Storage::disk('public')->assertExists($user->profile_photo_path);
    }

    public function test_update_profile_can_remove_existing_photo(): void
    {
        Storage::fake('public');

        $user = User::create([
            'name' => 'Siti Nurhaliza',
            'username' => '2024002',
            'email' => 'siti@example.com',
            'phone' => '081111',
            'role' => 'siswa',
            'password' => '2024002',
            'profile_photo_path' => 'profile-photos/existing-avatar.png',
        ]);

        Storage::disk('public')->put(
            'profile-photos/existing-avatar.png',
            base64_decode(self::TINY_PNG)
        );

        Student::create([
            'user_id' => $user->id,
            'nis' => '2024002',
            'name' => 'Siti Nurhaliza',
            'gender' => 'Perempuan',
            'email' => 'siti@example.com',
            'phone' => '081111',
        ]);

        $response = $this->post('/api/v1/auth/profile', [
            'username' => '2024002',
            'name' => 'Siti Nurhaliza',
            'email' => 'siti@example.com',
            'phone' => '081111',
            'remove_profile_photo' => true,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.profile_photo_url', null);

        $user->refresh();

        $this->assertNull($user->profile_photo_path);
    }

    public function test_update_password_requires_matching_current_password(): void
    {
        User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'role' => 'admin',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/password', [
            'username' => 'admin',
            'current_password' => 'wrong-password',
            'new_password' => 'newsecurepass',
            'new_password_confirmation' => 'newsecurepass',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_update_password_changes_user_password(): void
    {
        $user = User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'role' => 'admin',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/password', [
            'username' => 'admin',
            'current_password' => 'password123',
            'new_password' => 'newsecurepass',
            'new_password_confirmation' => 'newsecurepass',
        ]);

        $response->assertOk()->assertJsonPath('message', 'Password berhasil diperbarui.');

        $this->assertTrue(Hash::check('newsecurepass', $user->fresh()->password));
    }

    public function test_me_returns_teacher_profile_when_available(): void
    {
        $academicYear = AcademicYear::create([
            'name' => '2025/2026',
            'semester' => 'Genap',
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Ustadz Ahmad',
            'username' => 'NIP001',
            'email' => 'ahmad@example.com',
            'role' => 'guru-kelas',
            'password' => 'NIP001123',
        ]);

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'academic_year_id' => $academicYear->id,
            'nip' => 'NIP001',
            'name' => 'Ustadz Ahmad',
            'roles' => ['Wali Kelas', 'Guru Mapel'],
            'email' => 'ahmad@example.com',
            'phone' => '08123',
            'status' => 'Aktif',
        ]);

        SchoolClass::create([
            'academic_year_id' => $academicYear->id,
            'name' => 'XI-B',
            'level' => 'XI',
            'homeroom_teacher_id' => $teacher->id,
            'homeroom_teacher_name' => $teacher->name,
            'capacity' => 36,
        ]);

        $response = $this->getJson('/api/v1/auth/me?username=NIP001');

        $response
            ->assertOk()
            ->assertJsonPath('data.teacher.nip', 'NIP001')
            ->assertJsonPath('data.teacher.academic_year.name', '2025/2026')
            ->assertJsonPath('data.dashboard_context.homeroom_classes.0.name', 'XI-B');
    }
}
