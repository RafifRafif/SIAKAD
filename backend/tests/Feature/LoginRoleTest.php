<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LoginRoleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  list<string>  $guruAccess
     */
    #[DataProvider('roleRedirectProvider')]
    public function test_user_is_authenticated_and_sent_to_the_matching_dashboard(
        string $username,
        string $expectedRole,
        string $expectedRedirect,
        array $guruAccess = [],
    ): void {
        $this->createLoginUser($username, $guruAccess ?: [$expectedRole]);

        $response = $this->postJson('/login', [
            'username' => $username,
            'password' => $username,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('redirect_to', $expectedRedirect)
            ->assertJsonPath('user.role', $expectedRole)
            ->assertJsonPath('user.guruAccess', $guruAccess);

        $this->assertAuthenticated();
    }

    public function test_login_rejects_invalid_password(): void
    {
        $this->createLoginUser('admin', [User::ROLE_ADMIN]);

        $response = $this->postJson('/login', [
            'username' => 'admin',
            'password' => 'salah',
        ]);

        $response->assertStatus(422);
        $this->assertGuest();
    }

    public function test_linked_student_account_is_sent_to_student_dashboard_even_if_roles_are_stale(): void
    {
        Student::query()->create([
            'nis' => 'SIS099',
            'nama' => 'Siswa Role Test',
            'tahun_ajaran' => 'Tahun Test',
            'kelas' => 'Kelas Test',
            'jenis_kelamin' => 'Laki-laki',
            'email' => 'sis099@test.local',
            'telepon' => '080000000099',
        ]);

        User::query()->create([
            'name' => 'Siswa Role Test',
            'username' => 'SIS099',
            'email' => 'sis099@test.local',
            'password' => Hash::make('SIS099'),
            'roles' => [User::ROLE_ADMIN, User::ROLE_SISWA],
            'email_verified_at' => now(),
        ]);

        $this->postJson('/login', [
            'username' => 'SIS099',
            'password' => 'SIS099',
        ])
            ->assertOk()
            ->assertJsonPath('redirect_to', '/siswa')
            ->assertJsonPath('user.role', 'siswa');
    }

    public function test_linked_teacher_account_uses_teacher_roles_for_guru_access(): void
    {
        Teacher::query()->create([
            'nip' => 'TCH099',
            'nama' => 'Guru Role Test',
            'tahun_ajaran' => 'Tahun Test',
            'roles' => ['Guru Mapel'],
            'email' => 'tch099@test.local',
            'telepon' => '080000000199',
            'status' => 'Aktif',
        ]);

        User::query()->create([
            'name' => 'Guru Role Test',
            'username' => 'TCH099',
            'email' => 'tch099@test.local',
            'password' => Hash::make('TCH099'),
            'roles' => [User::ROLE_SISWA],
            'email_verified_at' => now(),
        ]);

        $this->postJson('/login', [
            'username' => 'TCH099',
            'password' => 'TCH099',
        ])
            ->assertOk()
            ->assertJsonPath('redirect_to', '/guru')
            ->assertJsonPath('user.role', 'guru')
            ->assertJsonPath('user.guruAccess', ['Guru Mapel']);
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: string, 3?: list<string>}>
     */
    public static function roleRedirectProvider(): array
    {
        return [
            'admin' => ['admin', 'admin', '/admin'],
            'guru mapel' => ['guru_mapel_test', 'guru', '/guru', ['Guru Mapel']],
            'wali kelas' => ['wali_kelas_test', 'guru', '/guru', ['Wali Kelas']],
            'guru mapel dan wali kelas' => [
                'guru_dual_test',
                'guru',
                '/guru',
                ['Guru Mapel', 'Wali Kelas'],
            ],
            'siswa' => ['siswa', 'siswa', '/siswa'],
        ];
    }

    /**
     * @param  list<string>  $roles
     */
    private function createLoginUser(string $username, array $roles): void
    {
        $normalizedRoles = array_map(
            fn (string $role): string => match ($role) {
                'admin' => User::ROLE_ADMIN,
                'siswa' => User::ROLE_SISWA,
                'Guru Mapel' => User::ROLE_GURU_MAPEL,
                'Wali Kelas' => User::ROLE_WALI_KELAS,
                default => $role,
            },
            $roles,
        );

        User::query()->create([
            'name' => 'User Test',
            'username' => $username,
            'email' => $username.'@test.local',
            'password' => Hash::make($username),
            'roles' => array_values($normalizedRoles),
            'email_verified_at' => now(),
        ]);
    }
}
