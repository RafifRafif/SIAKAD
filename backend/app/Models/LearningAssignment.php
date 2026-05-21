<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningAssignment extends Model
{
    protected $fillable = [
        'nama',
        'tahun_ajaran',
        'guru_pengampu',
        'kelas',
        'kelompok',
    ];

    /**
     * @return array{id: int, nama: string, tahunAjaran: string, guruPengampu: string, kelas: string, kelompok: string}
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'tahunAjaran' => $this->tahun_ajaran,
            'guruPengampu' => $this->guru_pengampu,
            'kelas' => $this->kelas,
            'kelompok' => $this->kelompok,
        ];
    }
}
