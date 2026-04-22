<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\GradeWeight;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('username', $credentials['username'])
            ->orWhere('email', $credentials['username'])
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah.'],
            ]);
        }

        return response()->json([
            'message' => 'Login berhasil.',
            'data' => $this->transformUser($user->load([
                'student.class',
                'student.academicYear',
                'teacher.academicYear',
                'teacher.homeroomClasses.students',
                'teacher.subjects',
            ])),
        ]);
    }

    public function me(Request $request)
    {
        $username = $request->query('username');

        if (! $username) {
            return response()->json([
                'message' => 'Parameter username wajib diisi.',
            ], 422);
        }

        $user = User::query()
            ->where('username', $username)
            ->with([
                'student.class',
                'student.academicYear',
                'teacher.academicYear',
                'teacher.homeroomClasses.students',
                'teacher.subjects',
            ])
            ->first();

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Profil user berhasil diambil.',
            'data' => $this->transformUser($user),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'exists:users,username'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:255'],
            'remove_profile_photo' => ['nullable', 'boolean'],
            'profile_photo' => ['nullable', 'image', 'max:2048'],
        ]);

        $user = User::query()
            ->where('username', $validated['username'])
            ->with(['student.class', 'student.academicYear', 'teacher.academicYear'])
            ->firstOrFail();

        $request->validate([
            'email' => [
                'nullable',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ]);

        if ($validated['remove_profile_photo'] ?? false) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
                $user->profile_photo_path = null;
            }
        }

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $user->profile_photo_path = $request->file('profile_photo')->store('profile-photos', 'public');
        }

        $user->save();

        if ($user->student) {
            $user->student->update([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ]);
        }

        if ($user->teacher) {
            $user->teacher->update([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ]);
        }

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'data' => $this->transformUser(
                $user->fresh()->load(['student.class', 'student.academicYear', 'teacher.academicYear'])
            ),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'exists:users,username'],
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::query()->where('username', $validated['username'])->firstOrFail();

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password lama tidak sesuai.'],
            ]);
        }

        $user->update([
            'password' => $validated['new_password'],
        ]);

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ]);
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'profile_photo_url' => $user->profile_photo_url,
            'student' => $user->student,
            'teacher' => $user->teacher,
            'dashboard_context' => $this->buildDashboardContext($user),
        ];
    }

    private function buildDashboardContext(User $user): array
    {
        return match ($user->role) {
            'admin' => [
                'total_students' => Student::count(),
                'total_teachers' => Teacher::count(),
                'total_classes' => SchoolClass::count(),
                'total_subjects' => Subject::count(),
                'active_academic_year' => AcademicYear::query()->where('is_active', true)->first(),
                'grade_weight_count' => GradeWeight::count(),
            ],
            'guru-kelas' => [
                'homeroom_classes' => $user->teacher?->homeroomClasses
                    ?->map(fn (SchoolClass $schoolClass) => [
                        'id' => $schoolClass->id,
                        'name' => $schoolClass->name,
                        'level' => $schoolClass->level,
                        'student_count' => $schoolClass->students->count(),
                    ])
                    ->values()
                    ->all() ?? [],
                'subject_count' => $user->teacher?->subjects?->count() ?? 0,
            ],
            'guru-mapel' => [
                'subject_count' => $user->teacher?->subjects?->count() ?? 0,
            ],
            'siswa' => [
                'class_name' => $user->student?->class?->name,
                'academic_year' => $user->student?->academicYear,
            ],
            default => [],
        };
    }
}
