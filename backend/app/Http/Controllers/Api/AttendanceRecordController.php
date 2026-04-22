<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AttendanceRecordController extends Controller
{
    public function index(Request $request)
    {
        $records = AttendanceRecord::query()
            ->with(['academicYear', 'class', 'subject', 'teacher', 'student'])
            ->when($request->query('class_id'), fn ($query, $classId) => $query->where('class_id', $classId))
            ->when($request->query('student_id'), fn ($query, $studentId) => $query->where('student_id', $studentId))
            ->when($request->query('teacher_id'), fn ($query, $teacherId) => $query->where('teacher_id', $teacherId))
            ->when($request->query('subject_id'), fn ($query, $subjectId) => $query->where('subject_id', $subjectId))
            ->when($request->query('attendance_date'), fn ($query, $date) => $query->whereDate('attendance_date', $date))
            ->latest('attendance_date')
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $records,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'class_id' => ['nullable', 'exists:school_classes,id'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'student_id' => ['required', 'exists:students,id'],
            'attendance_date' => ['required', 'date'],
            'status' => ['required', Rule::in(['Hadir', 'Tidak Hadir', 'Izin', 'Sakit'])],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $record = AttendanceRecord::create($data);

        return response()->json([
            'message' => 'Presensi berhasil ditambahkan.',
            'data' => $record->load(['academicYear', 'class', 'subject', 'teacher', 'student']),
        ], 201);
    }

    public function show(string $id)
    {
        return response()->json([
            'data' => AttendanceRecord::with(['academicYear', 'class', 'subject', 'teacher', 'student'])->findOrFail($id),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $record = AttendanceRecord::findOrFail($id);

        $data = $request->validate([
            'academic_year_id' => ['sometimes', 'nullable', 'exists:academic_years,id'],
            'class_id' => ['sometimes', 'nullable', 'exists:school_classes,id'],
            'subject_id' => ['sometimes', 'nullable', 'exists:subjects,id'],
            'teacher_id' => ['sometimes', 'nullable', 'exists:teachers,id'],
            'student_id' => ['sometimes', 'exists:students,id'],
            'attendance_date' => ['sometimes', 'date'],
            'status' => ['sometimes', Rule::in(['Hadir', 'Tidak Hadir', 'Izin', 'Sakit'])],
            'notes' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $record->update($data);

        return response()->json([
            'message' => 'Presensi berhasil diperbarui.',
            'data' => $record->fresh()->load(['academicYear', 'class', 'subject', 'teacher', 'student']),
        ]);
    }

    public function destroy(string $id)
    {
        $record = AttendanceRecord::findOrFail($id);
        $record->delete();

        return response()->json([
            'message' => 'Presensi berhasil dihapus.',
        ]);
    }
}
