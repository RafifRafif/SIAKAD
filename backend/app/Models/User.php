<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_GURU_MAPEL = 'guru_mapel';

    public const ROLE_WALI_KELAS = 'wali_kelas';

    public const ROLE_SISWA = 'siswa';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'roles',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'roles' => 'array',
        ];
    }

    public function hasRole(string $role): bool
    {
        return in_array($role, $this->effectiveRoles(), true);
    }

    /**
     * @param  list<string>  $roles
     */
    public function hasAnyRole(array $roles): bool
    {
        return count(array_intersect($this->effectiveRoles(), $roles)) > 0;
    }

    /**
     * @return list<string>
     */
    public function effectiveRoles(): array
    {
        $storedRoles = $this->roles ?? [];

        if (in_array(self::ROLE_ADMIN, $storedRoles, true)) {
            return $storedRoles;
        }

        $teacher = Teacher::query()->where('nip', $this->username)->first();

        if ($teacher !== null) {
            $roles = [];
            $teacherRoles = $teacher->roles ?? [];

            if (in_array('Guru Mapel', $teacherRoles, true)) {
                $roles[] = self::ROLE_GURU_MAPEL;
            }

            if (in_array('Wali Kelas', $teacherRoles, true)) {
                $roles[] = self::ROLE_WALI_KELAS;
            }

            return $roles;
        }

        if ($this->isLinkedStudentAccount()) {
            return [self::ROLE_SISWA];
        }

        return $storedRoles;
    }

    public function dashboardPath(): string
    {
        if ($this->isLinkedStudentAccount()) {
            return '/siswa';
        }

        if ($this->isLinkedTeacherAccount()) {
            return '/guru';
        }

        if ($this->hasRole(self::ROLE_SISWA)) {
            return '/siswa';
        }

        if ($this->hasAnyRole([self::ROLE_GURU_MAPEL, self::ROLE_WALI_KELAS])) {
            return '/guru';
        }

        if ($this->hasRole(self::ROLE_ADMIN)) {
            return '/admin';
        }

        return '/login';
    }

    public function frontendRole(): string
    {
        if ($this->isLinkedStudentAccount()) {
            return 'siswa';
        }

        if ($this->isLinkedTeacherAccount()) {
            return 'guru';
        }

        if ($this->hasRole(self::ROLE_SISWA)) {
            return 'siswa';
        }

        if ($this->hasAnyRole([self::ROLE_GURU_MAPEL, self::ROLE_WALI_KELAS])) {
            return 'guru';
        }

        if ($this->hasRole(self::ROLE_ADMIN)) {
            return 'admin';
        }

        return 'siswa';
    }

    /**
     * @return list<string>
     */
    public function guruAccess(): array
    {
        $teacher = Teacher::query()->where('nip', $this->username)->first();

        if ($teacher !== null) {
            $teacherRoles = $teacher->roles ?? [];

            return array_values(array_filter(
                ['Guru Mapel', 'Wali Kelas'],
                fn (string $role): bool => in_array($role, $teacherRoles, true)
            ));
        }

        $access = [];

        if ($this->hasRole(self::ROLE_GURU_MAPEL)) {
            $access[] = 'Guru Mapel';
        }

        if ($this->hasRole(self::ROLE_WALI_KELAS)) {
            $access[] = 'Wali Kelas';
        }

        return $access;
    }

    private function isLinkedStudentAccount(): bool
    {
        return Student::query()->where('nis', $this->username)->exists();
    }

    private function isLinkedTeacherAccount(): bool
    {
        return Teacher::query()->where('nip', $this->username)->exists();
    }
}
