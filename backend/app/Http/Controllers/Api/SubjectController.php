<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => Subject::query()->with(['academicYear', 'teacher', 'schoolClass'])->latest()->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'class_id' => ['nullable', 'exists:school_classes,id'],
            'code' => ['nullable', 'string', 'max:255', 'unique:subjects,code'],
            'name' => ['required', 'string', 'max:255'],
            'group_type' => ['nullable', 'in:Ikhwan,Akhwat'],
            'description' => ['nullable', 'string'],
        ]);

        $data['code'] = $data['code'] ?? $this->generateSubjectCode($data['name']);

        $subject = Subject::create($data);

        return response()->json([
            'message' => 'Data pelajaran berhasil ditambahkan.',
            'data' => $subject->load(['academicYear', 'teacher', 'schoolClass']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json([
            'data' => Subject::with(['academicYear', 'teacher', 'schoolClass'])->findOrFail($id),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $subject = Subject::findOrFail($id);

        $data = $request->validate([
            'academic_year_id' => ['sometimes', 'nullable', 'exists:academic_years,id'],
            'teacher_id' => ['sometimes', 'nullable', 'exists:teachers,id'],
            'class_id' => ['sometimes', 'nullable', 'exists:school_classes,id'],
            'code' => ['sometimes', 'nullable', 'string', 'max:255', 'unique:subjects,code,'.$subject->id],
            'name' => ['sometimes', 'string', 'max:255'],
            'group_type' => ['sometimes', 'nullable', 'in:Ikhwan,Akhwat'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        if (array_key_exists('name', $data) && (! array_key_exists('code', $data) || ! $data['code'])) {
            $data['code'] = $this->generateSubjectCode($data['name'], $subject->id);
        }

        $subject->update($data);

        return response()->json([
            'message' => 'Data pelajaran berhasil diperbarui.',
            'data' => $subject->fresh()->load(['academicYear', 'teacher', 'schoolClass']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $subject = Subject::findOrFail($id);
        $subject->delete();

        return response()->json([
            'message' => 'Data pelajaran berhasil dihapus.',
        ]);
    }

    private function generateSubjectCode(string $name, ?int $ignoreId = null): string
    {
        $baseCode = Str::upper(Str::slug(Str::limit($name, 24, ''), ''));
        $baseCode = $baseCode !== '' ? $baseCode : 'MAPEL';
        $candidate = $baseCode;
        $suffix = 1;

        while (
            Subject::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('code', $candidate)
                ->exists()
        ) {
            $candidate = $baseCode.$suffix;
            $suffix++;
        }

        return $candidate;
    }
}
