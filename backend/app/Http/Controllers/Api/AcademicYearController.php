<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => AcademicYear::query()->latest()->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'semester' => ['required', 'in:Ganjil,Genap'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:Aktif,Draft,Arsip'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $status = $data['status'] ?? (($data['is_active'] ?? false) ? 'Aktif' : 'Draft');
        $isActive = $status === 'Aktif' || ($data['is_active'] ?? false);

        if ($isActive) {
            AcademicYear::query()
                ->where('status', 'Aktif')
                ->update([
                    'is_active' => false,
                    'status' => 'Arsip',
                ]);
        }

        $academicYear = AcademicYear::create([
            ...$data,
            'status' => $isActive ? 'Aktif' : $status,
            'is_active' => $isActive,
        ]);

        return response()->json([
            'message' => 'Tahun ajaran berhasil ditambahkan.',
            'data' => $academicYear,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json([
            'data' => AcademicYear::findOrFail($id),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $academicYear = AcademicYear::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'semester' => ['sometimes', 'in:Ganjil,Genap'],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['sometimes', 'nullable', 'in:Aktif,Draft,Arsip'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $status = $data['status'] ?? $academicYear->status ?? ($academicYear->is_active ? 'Aktif' : 'Draft');
        $isActive = ($data['is_active'] ?? false) === true || $status === 'Aktif';

        if ($isActive) {
            AcademicYear::query()
                ->whereKeyNot($academicYear->id)
                ->where('status', 'Aktif')
                ->update([
                    'is_active' => false,
                    'status' => 'Arsip',
                ]);
        }

        $academicYear->update([
            ...$data,
            'status' => $isActive ? 'Aktif' : $status,
            'is_active' => $isActive,
        ]);

        return response()->json([
            'message' => 'Tahun ajaran berhasil diperbarui.',
            'data' => $academicYear->fresh(),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $academicYear = AcademicYear::findOrFail($id);
        $academicYear->delete();

        return response()->json([
            'message' => 'Tahun ajaran berhasil dihapus.',
        ]);
    }
}
