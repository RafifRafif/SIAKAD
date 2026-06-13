<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class TeacherController extends Controller
{
    private const HOMEROOM_ROLE = 'Wali Kelas';

    private const SUBJECT_ROLE = 'Guru Mapel';

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => Teacher::query()->with(['academicYear', 'user'])->latest()->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'nip' => ['required', 'string', 'max:255', 'unique:teachers,nip'],
            'name' => ['required', 'string', 'max:255'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['in:Wali Kelas,Guru Mapel,Guru Mata Pelajaran'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:Aktif,Cuti'],
        ]);
        $data['roles'] = $this->normalizeTeacherRoles($data['roles']);

        $teacher = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'username' => $data['nip'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'role' => 'guru',
                'password' => Hash::make($data['nip']),
            ]);

            $teacher = Teacher::create([
                ...$data,
                'user_id' => $user->id,
            ]);

            $this->syncHomeroomClassAssignments($teacher, $teacher->name);

            return $teacher;
        });

        return response()->json([
            'message' => 'Data guru berhasil ditambahkan. Username dan password awal guru mengikuti NIP.',
            'data' => $teacher->load(['academicYear', 'user']),
            'login_credentials' => $this->buildLoginCredentials($teacher->fresh()),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json([
            'data' => Teacher::with(['academicYear', 'user'])->findOrFail($id),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $teacher = Teacher::findOrFail($id);

        $data = $request->validate([
            'academic_year_id' => ['sometimes', 'nullable', 'exists:academic_years,id'],
            'nip' => ['sometimes', 'string', 'max:255', 'unique:teachers,nip,'.$teacher->id],
            'name' => ['sometimes', 'string', 'max:255'],
            'roles' => ['sometimes', 'array', 'min:1'],
            'roles.*' => ['in:Wali Kelas,Guru Mapel,Guru Mata Pelajaran'],
            'email' => ['sometimes', 'nullable', 'email'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:Aktif,Cuti'],
        ]);

        if (array_key_exists('roles', $data)) {
            $data['roles'] = $this->normalizeTeacherRoles($data['roles']);
        }

        DB::transaction(function () use ($data, $teacher) {
            $originalName = $teacher->name;
            $teacher->update($data);

            if (! $teacher->user) {
                $teacher->user()->associate(User::create([
                    'name' => $data['name'] ?? $teacher->name,
                    'username' => $data['nip'] ?? $teacher->nip,
                    'email' => $data['email'] ?? $teacher->email,
                    'phone' => $data['phone'] ?? $teacher->phone,
                    'role' => 'guru',
                    'password' => Hash::make($data['nip'] ?? $teacher->nip),
                ]));
                $teacher->save();
            }

            if ($teacher->user) {
                validator(
                    ['email' => $data['email'] ?? $teacher->user->email],
                    [
                        'email' => [
                            'nullable',
                            'email',
                            Rule::unique('users', 'email')->ignore($teacher->user->id),
                        ],
                    ]
                )->validate();

                $teacher->user->update([
                    'name' => $data['name'] ?? $teacher->name,
                    'username' => $data['nip'] ?? $teacher->nip,
                    'email' => array_key_exists('email', $data) ? $data['email'] : $teacher->email,
                    'phone' => array_key_exists('phone', $data) ? $data['phone'] : $teacher->phone,
                    'role' => 'guru',
                    'password' => array_key_exists('nip', $data)
                        ? Hash::make($data['nip'])
                        : $teacher->user->password,
                ]);
            }

            $this->syncHomeroomClassAssignments($teacher->fresh(), $originalName);
        });

        return response()->json([
            'message' => 'Data guru berhasil diperbarui.',
            'data' => $teacher->fresh()->load(['academicYear', 'user']),
            'login_credentials' => $this->buildLoginCredentials($teacher->fresh()),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $teacher = Teacher::findOrFail($id);

        DB::transaction(function () use ($teacher) {
            $user = $teacher->user;
            $teacher->delete();
            $user?->delete();
        });

        return response()->json([
            'message' => 'Data guru berhasil dihapus.',
        ]);
    }

    private function syncHomeroomClassAssignments(Teacher $teacher, ?string $originalName = null): void
    {
        $isHomeroomTeacher = in_array(
            self::HOMEROOM_ROLE,
            $this->normalizeTeacherRoles($teacher->roles ?? []),
            true
        );

        $query = $teacher->homeroomClasses();

        if ($originalName) {
            $query->orWhere('homeroom_teacher_name', $originalName);
        }

        if (! $isHomeroomTeacher) {
            $query->update([
                'homeroom_teacher_id' => null,
            ]);

            return;
        }

        $query->update([
            'homeroom_teacher_id' => $teacher->id,
            'homeroom_teacher_name' => $teacher->name,
        ]);
    }

    private function buildLoginCredentials(Teacher $teacher): array
    {
        return [
            'username' => $teacher->nip,
            'password' => $teacher->nip,
            'role' => 'guru',
        ];
    }

    /**
     * @param array<int, string> $roles
     * @return list<string>
     */
    private function normalizeTeacherRoles(array $roles): array
    {
        $normalizedRoles = [];

        foreach ($roles as $role) {
            $normalizedRole = match (strtolower(trim($role))) {
                'wali kelas' => self::HOMEROOM_ROLE,
                'guru mapel', 'guru mata pelajaran' => self::SUBJECT_ROLE,
                default => null,
            };

            if ($normalizedRole && ! in_array($normalizedRole, $normalizedRoles, true)) {
                $normalizedRoles[] = $normalizedRole;
            }
        }

        return $normalizedRoles;
    }
}
