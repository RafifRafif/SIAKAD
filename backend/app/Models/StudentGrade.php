<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentGrade extends Model
{
    /**
     * @var array<string, string|null>
     */
    private static array $guruLookupCache = [];

    protected $fillable = [
        'student_id',
        'nis',
        'nama',
        'kelas',
        'tahun_ajaran',
        'mapel',
        'jenis_penilaian',
        'nilai',
        'guru',
        'tanggal',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date:Y-m-d',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'studentId' => $this->student_id,
            'nis' => $this->nis,
            'nama' => $this->nama,
            'kelas' => $this->kelas,
            'tahunAjaran' => $this->tahun_ajaran,
            'mapel' => $this->mapel,
            'jenis' => $this->jenis_penilaian,
            'nilai' => $this->nilai,
            'grade' => $this->grade(),
            'guru' => $this->guru ?? $this->guruFromLearningAssignment(),
            'tanggal' => $this->tanggal?->format('Y-m-d'),
        ];
    }

    public function grade(): string
    {
        return match (true) {
            $this->nilai >= 90 => 'A',
            $this->nilai >= 80 => 'B',
            $this->nilai >= 70 => 'C',
            $this->nilai >= 60 => 'D',
            default => 'E',
        };
    }

    private function guruFromLearningAssignment(): ?string
    {
        $cacheKey = implode('|', [
            $this->mapel,
            $this->kelas,
            $this->tahun_ajaran ?? '',
        ]);

        if (array_key_exists($cacheKey, self::$guruLookupCache)) {
            return self::$guruLookupCache[$cacheKey];
        }

        return self::$guruLookupCache[$cacheKey] = LearningAssignment::query()
            ->where('nama', $this->mapel)
            ->where('kelas', $this->kelas)
            ->when($this->tahun_ajaran, fn ($query) => $query->where('tahun_ajaran', $this->tahun_ajaran))
            ->value('guru_pengampu');
    }
}
