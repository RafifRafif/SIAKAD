<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeEntry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GradeEntryController extends Controller
{
    public function index(Request $request)
    {
        $entries = GradeEntry::query()
            ->with(['academicYear', 'subject', 'teacher', 'student.class'])
            ->when($request->query('student_id'), fn ($query, $studentId) => $query->where('student_id', $studentId))
            ->when($request->query('teacher_id'), fn ($query, $teacherId) => $query->where('teacher_id', $teacherId))
            ->when($request->query('subject_id'), fn ($query, $subjectId) => $query->where('subject_id', $subjectId))
            ->when(
                $request->query('class_id'),
                fn ($query, $classId) => $query->whereHas('student', fn ($studentQuery) => $studentQuery->where('class_id', $classId))
            )
            ->when($request->query('assessment_type'), fn ($query, $type) => $query->where('assessment_type', $type))
            ->latest('entry_date')
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $entries,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'student_id' => ['required', 'exists:students,id'],
            'assessment_type' => ['required', Rule::in(['UTS', 'UAS', 'Tugas', 'Quiz'])],
            'score' => ['required', 'integer', 'min:0', 'max:100'],
            'entry_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $entry = GradeEntry::create($data);

        return response()->json([
            'message' => 'Nilai berhasil ditambahkan.',
            'data' => $entry->load(['academicYear', 'subject', 'teacher', 'student.class']),
        ], 201);
    }

    public function show(string $id)
    {
        return response()->json([
            'data' => GradeEntry::with(['academicYear', 'subject', 'teacher', 'student.class'])->findOrFail($id),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $entry = GradeEntry::findOrFail($id);

        $data = $request->validate([
            'academic_year_id' => ['sometimes', 'nullable', 'exists:academic_years,id'],
            'subject_id' => ['sometimes', 'exists:subjects,id'],
            'teacher_id' => ['sometimes', 'nullable', 'exists:teachers,id'],
            'student_id' => ['sometimes', 'exists:students,id'],
            'assessment_type' => ['sometimes', Rule::in(['UTS', 'UAS', 'Tugas', 'Quiz'])],
            'score' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'entry_date' => ['sometimes', 'date'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $entry->update($data);

        return response()->json([
            'message' => 'Nilai berhasil diperbarui.',
            'data' => $entry->fresh()->load(['academicYear', 'subject', 'teacher', 'student.class']),
        ]);
    }

    public function destroy(string $id)
    {
        $entry = GradeEntry::findOrFail($id);
        $entry->delete();

        return response()->json([
            'message' => 'Nilai berhasil dihapus.',
        ]);
    }
}
