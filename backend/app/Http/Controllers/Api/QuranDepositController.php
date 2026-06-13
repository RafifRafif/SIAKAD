<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuranDeposit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuranDepositController extends Controller
{
    public function index(Request $request)
    {
        $deposits = QuranDeposit::query()
            ->with(['teacher', 'student.class'])
            ->when($request->query('student_id'), fn ($query, $studentId) => $query->where('student_id', $studentId))
            ->when($request->query('teacher_id'), fn ($query, $teacherId) => $query->where('teacher_id', $teacherId))
            ->when(
                $request->query('class_id'),
                fn ($query, $classId) => $query->whereHas('student', fn ($studentQuery) => $studentQuery->where('class_id', $classId))
            )
            ->latest('deposit_date')
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $deposits,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'student_id' => ['required', 'exists:students,id'],
            'deposit_date' => ['required', 'date'],
            'surah' => ['required', 'string', 'max:255'],
            'verse_start' => ['required', 'integer', 'min:1'],
            'verse_end' => ['required', 'integer', 'gte:verse_start'],
            'assessment' => ['required', Rule::in(['Lancar', 'Kurang Lancar', 'Perlu Perbaikan'])],
            'notes' => ['nullable', 'string'],
        ]);

        $deposit = QuranDeposit::create($data);

        return response()->json([
            'message' => 'Setoran Al-Qur\'an berhasil ditambahkan.',
            'data' => $deposit->load(['teacher', 'student.class']),
        ], 201);
    }

    public function show(string $id)
    {
        return response()->json([
            'data' => QuranDeposit::with(['teacher', 'student.class'])->findOrFail($id),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $deposit = QuranDeposit::findOrFail($id);

        $data = $request->validate([
            'teacher_id' => ['sometimes', 'nullable', 'exists:teachers,id'],
            'student_id' => ['sometimes', 'exists:students,id'],
            'deposit_date' => ['sometimes', 'date'],
            'surah' => ['sometimes', 'string', 'max:255'],
            'verse_start' => ['sometimes', 'integer', 'min:1'],
            'verse_end' => ['sometimes', 'integer', 'gte:verse_start'],
            'assessment' => ['sometimes', Rule::in(['Lancar', 'Kurang Lancar', 'Perlu Perbaikan'])],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $deposit->update($data);

        return response()->json([
            'message' => 'Setoran Al-Qur\'an berhasil diperbarui.',
            'data' => $deposit->fresh()->load(['teacher', 'student.class']),
        ]);
    }

    public function destroy(string $id)
    {
        $deposit = QuranDeposit::findOrFail($id);
        $deposit->delete();

        return response()->json([
            'message' => 'Setoran Al-Qur\'an berhasil dihapus.',
        ]);
    }
}
