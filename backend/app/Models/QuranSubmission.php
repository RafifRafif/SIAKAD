<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuranSubmission extends Model
{
    protected $fillable = [
        'student_id',
        'nis',
        'nama',
        'kelas',
        'tahun_ajaran',
        'tanggal',
        'surah',
        'ayat_mulai',
        'ayat_selesai',
        'penilaian',
        'keterangan',
        'foto_setoran',
        'progress_juz',
        'guru',
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
            'tanggal' => $this->tanggal?->format('Y-m-d'),
            'surah' => $this->surah,
            'ayatMulai' => $this->ayat_mulai,
            'ayatSelesai' => $this->ayat_selesai,
            'penilaian' => $this->penilaian,
            'nilai' => $this->penilaian,
            'keterangan' => $this->keterangan,
            'fotoSetoran' => $this->foto_setoran,
            'progress' => $this->progress_juz,
            'guru' => $this->guru,
        ];
    }
}
