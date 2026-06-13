<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => Student::query()
                ->with(['academicYear', 'class'])
                ->latest()
                ->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'class_id' => ['nullable', 'exists:school_classes,id'],
            'nis' => ['required', 'string', 'max:255', 'unique:students,nis'],
            'name' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'in:Laki-laki,Perempuan'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:255'],
        ]);

        $student = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'username' => $data['nis'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'role' => 'siswa',
                'password' => Hash::make($data['nis']),
            ]);

            return Student::create([
                ...$data,
                'user_id' => $user->id,
            ]);
        });

        return response()->json([
            'message' => 'Data siswa berhasil ditambahkan. Username dan password awal siswa mengikuti NIS.',
            'data' => $student->load(['academicYear', 'class']),
            'login_credentials' => $this->buildLoginCredentials($student->fresh()),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json([
            'data' => Student::with(['academicYear', 'class'])->findOrFail($id),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $student = Student::findOrFail($id);

        $data = $request->validate([
            'academic_year_id' => ['sometimes', 'nullable', 'exists:academic_years,id'],
            'class_id' => ['sometimes', 'nullable', 'exists:school_classes,id'],
            'nis' => ['sometimes', 'string', 'max:255', 'unique:students,nis,'.$student->id],
            'name' => ['sometimes', 'string', 'max:255'],
            'gender' => ['sometimes', 'in:Laki-laki,Perempuan'],
            'email' => ['sometimes', 'nullable', 'email'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($data, $student) {
            $student->update($data);

            if (! $student->user) {
                $student->user()->associate(User::create([
                    'name' => $data['name'] ?? $student->name,
                    'username' => $data['nis'] ?? $student->nis,
                    'email' => $data['email'] ?? $student->email,
                    'phone' => $data['phone'] ?? $student->phone,
                    'role' => 'siswa',
                    'password' => Hash::make($data['nis'] ?? $student->nis),
                ]));
                $student->save();
            }

            if ($student->user) {
                validator(
                    ['email' => $data['email'] ?? $student->user->email],
                    [
                        'email' => [
                            'nullable',
                            'email',
                            Rule::unique('users', 'email')->ignore($student->user->id),
                        ],
                    ]
                )->validate();

                $student->user->update([
                    'name' => $data['name'] ?? $student->name,
                    'username' => $data['nis'] ?? $student->nis,
                    'email' => array_key_exists('email', $data) ? $data['email'] : $student->email,
                    'phone' => array_key_exists('phone', $data) ? $data['phone'] : $student->phone,
                    'password' => array_key_exists('nis', $data)
                        ? Hash::make($data['nis'])
                        : $student->user->password,
                ]);
            }
        });

        return response()->json([
            'message' => 'Data siswa berhasil diperbarui.',
            'data' => $student->fresh()->load(['academicYear', 'class']),
            'login_credentials' => $this->buildLoginCredentials($student->fresh()),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);

        DB::transaction(function () use ($student) {
            $user = $student->user;
            $student->delete();
            $user?->delete();
        });

        return response()->json([
            'message' => 'Data siswa berhasil dihapus.',
        ]);
    }

    private function buildLoginCredentials(Student $student): array
    {
        return [
            'username' => $student->nis,
            'password' => $student->nis,
            'role' => 'siswa',
        ];
    }
}
