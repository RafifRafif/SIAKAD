<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeWeight;
use Illuminate\Http\Request;

class GradeWeightController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->ensureDefaultConfigurationExists();

        return response()->json([
            'data' => GradeWeight::query()->with('academicYear')->latest()->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'title' => ['required', 'string', 'max:255'],
            'knowledge_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'skill_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'attitude_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'components' => ['nullable', 'array'],
            'components.*.id' => ['required_with:components', 'string'],
            'components.*.jenisPenilaian' => ['required_with:components', 'string'],
            'components.*.bobot' => ['required_with:components', 'integer', 'min:0', 'max:100'],
            'grade_ranges' => ['nullable', 'array'],
            'grade_ranges.*.id' => ['required_with:grade_ranges', 'string'],
            'grade_ranges.*.grade' => ['required_with:grade_ranges', 'string'],
            'grade_ranges.*.nilaiMinimum' => ['required_with:grade_ranges', 'integer', 'min:0', 'max:100'],
            'grade_ranges.*.nilaiMaksimum' => ['required_with:grade_ranges', 'integer', 'min:0', 'max:100'],
        ]);

        if (($data['knowledge_weight'] + $data['skill_weight'] + $data['attitude_weight']) !== 100) {
            return response()->json([
                'message' => 'Total bobot penilaian harus 100.',
            ], 422);
        }

        if (array_key_exists('components', $data) && collect($data['components'])->sum('bobot') !== 100) {
            return response()->json([
                'message' => 'Total bobot komponen penilaian harus 100.',
            ], 422);
        }

        $gradeWeight = GradeWeight::create($data);

        return response()->json([
            'message' => 'Bobot penilaian berhasil ditambahkan.',
            'data' => $gradeWeight->load('academicYear'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json([
            'data' => GradeWeight::with('academicYear')->findOrFail($id),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $gradeWeight = GradeWeight::findOrFail($id);

        $data = $request->validate([
            'academic_year_id' => ['sometimes', 'nullable', 'exists:academic_years,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'knowledge_weight' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'skill_weight' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'attitude_weight' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'components' => ['sometimes', 'nullable', 'array'],
            'components.*.id' => ['required_with:components', 'string'],
            'components.*.jenisPenilaian' => ['required_with:components', 'string'],
            'components.*.bobot' => ['required_with:components', 'integer', 'min:0', 'max:100'],
            'grade_ranges' => ['sometimes', 'nullable', 'array'],
            'grade_ranges.*.id' => ['required_with:grade_ranges', 'string'],
            'grade_ranges.*.grade' => ['required_with:grade_ranges', 'string'],
            'grade_ranges.*.nilaiMinimum' => ['required_with:grade_ranges', 'integer', 'min:0', 'max:100'],
            'grade_ranges.*.nilaiMaksimum' => ['required_with:grade_ranges', 'integer', 'min:0', 'max:100'],
        ]);

        $knowledge = $data['knowledge_weight'] ?? $gradeWeight->knowledge_weight;
        $skill = $data['skill_weight'] ?? $gradeWeight->skill_weight;
        $attitude = $data['attitude_weight'] ?? $gradeWeight->attitude_weight;

        if (($knowledge + $skill + $attitude) !== 100) {
            return response()->json([
                'message' => 'Total bobot penilaian harus 100.',
            ], 422);
        }

        if (array_key_exists('components', $data) && collect($data['components'])->sum('bobot') !== 100) {
            return response()->json([
                'message' => 'Total bobot komponen penilaian harus 100.',
            ], 422);
        }

        $gradeWeight->update($data);

        return response()->json([
            'message' => 'Bobot penilaian berhasil diperbarui.',
            'data' => $gradeWeight->fresh()->load('academicYear'),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $gradeWeight = GradeWeight::findOrFail($id);
        $gradeWeight->delete();

        return response()->json([
            'message' => 'Bobot penilaian berhasil dihapus.',
        ]);
    }

    private function ensureDefaultConfigurationExists(): void
    {
        if (GradeWeight::query()->exists()) {
            return;
        }

        GradeWeight::create([
            'title' => 'Konfigurasi Bobot Penilaian',
            'knowledge_weight' => 30,
            'skill_weight' => 30,
            'attitude_weight' => 40,
            'components' => [
                [
                    'id' => 'quiz',
                    'jenisPenilaian' => 'Quiz',
                    'bobot' => 10,
                ],
                [
                    'id' => 'tugas',
                    'jenisPenilaian' => 'Tugas',
                    'bobot' => 20,
                ],
                [
                    'id' => 'uts',
                    'jenisPenilaian' => 'UTS',
                    'bobot' => 30,
                ],
                [
                    'id' => 'uas',
                    'jenisPenilaian' => 'UAS',
                    'bobot' => 40,
                ],
            ],
            'grade_ranges' => [
                [
                    'id' => 'A',
                    'grade' => 'A',
                    'nilaiMinimum' => 90,
                    'nilaiMaksimum' => 100,
                ],
                [
                    'id' => 'B',
                    'grade' => 'B',
                    'nilaiMinimum' => 80,
                    'nilaiMaksimum' => 89,
                ],
                [
                    'id' => 'C',
                    'grade' => 'C',
                    'nilaiMinimum' => 70,
                    'nilaiMaksimum' => 79,
                ],
                [
                    'id' => 'D',
                    'grade' => 'D',
                    'nilaiMinimum' => 60,
                    'nilaiMaksimum' => 69,
                ],
                [
                    'id' => 'E',
                    'grade' => 'E',
                    'nilaiMinimum' => 0,
                    'nilaiMaksimum' => 59,
                ],
            ],
        ]);
    }
}
