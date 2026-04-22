<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => SchoolClass::query()->with(['academicYear', 'homeroomTeacher'])->latest()->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'name' => ['required', 'string', 'max:255', 'unique:school_classes,name'],
            'level' => ['required', 'in:X,XI,XII'],
            'group_type' => ['nullable', 'in:Ikhwan,Akhwat'],
            'homeroom_teacher_id' => ['nullable', 'exists:teachers,id'],
            'homeroom_teacher_name' => ['nullable', 'string', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ]);

        $teacher = $this->resolveHomeroomTeacher($data);

        $schoolClass = SchoolClass::create([
            ...$data,
            'group_type' => $data['group_type'] ?? null,
            'homeroom_teacher_id' => $teacher?->id ?? ($data['homeroom_teacher_id'] ?? null),
            'homeroom_teacher_name' => $teacher?->name ?? ($data['homeroom_teacher_name'] ?? null),
            'capacity' => $data['capacity'] ?? 36,
        ]);

        return response()->json([
            'message' => 'Data kelas berhasil ditambahkan.',
            'data' => $schoolClass->load(['academicYear', 'homeroomTeacher']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json([
            'data' => SchoolClass::with(['academicYear', 'students', 'homeroomTeacher'])->findOrFail($id),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $schoolClass = SchoolClass::findOrFail($id);

        $data = $request->validate([
            'academic_year_id' => ['sometimes', 'nullable', 'exists:academic_years,id'],
            'name' => ['sometimes', 'string', 'max:255', 'unique:school_classes,name,'.$schoolClass->id],
            'level' => ['sometimes', 'in:X,XI,XII'],
            'group_type' => ['sometimes', 'nullable', 'in:Ikhwan,Akhwat'],
            'homeroom_teacher_id' => ['sometimes', 'nullable', 'exists:teachers,id'],
            'homeroom_teacher_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
        ]);

        $teacher = $this->resolveHomeroomTeacher($data);

        if (array_key_exists('homeroom_teacher_id', $data) || array_key_exists('homeroom_teacher_name', $data)) {
            $data['homeroom_teacher_id'] = $teacher?->id ?? ($data['homeroom_teacher_id'] ?? null);
            $data['homeroom_teacher_name'] = $teacher?->name ?? ($data['homeroom_teacher_name'] ?? null);
        }

        $schoolClass->update($data);

        return response()->json([
            'message' => 'Data kelas berhasil diperbarui.',
            'data' => $schoolClass->fresh()->load(['academicYear', 'homeroomTeacher']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $schoolClass = SchoolClass::findOrFail($id);
        $schoolClass->delete();

        return response()->json([
            'message' => 'Data kelas berhasil dihapus.',
        ]);
    }

    private function resolveHomeroomTeacher(array $data): ?Teacher
    {
        if (array_key_exists('homeroom_teacher_id', $data) && $data['homeroom_teacher_id']) {
            return Teacher::find($data['homeroom_teacher_id']);
        }

        if (array_key_exists('homeroom_teacher_name', $data) && $data['homeroom_teacher_name']) {
            return Teacher::query()->where('name', $data['homeroom_teacher_name'])->first();
        }

        return null;
    }
}
