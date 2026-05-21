<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    protected $fillable = [
        'nama',
        'tahun_ajaran',
        'kelompok',
        'wali_kelas',
        'jumlah_siswa',
    ];

    /**
     * @return array{id: int, nama: string, tahunAjaran: string, kelompok: string, waliKelas: ?string, jumlahSiswa: int}
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'tahunAjaran' => $this->tahun_ajaran,
            'kelompok' => $this->kelompok,
            'waliKelas' => $this->wali_kelas,
            'jumlahSiswa' => $this->jumlah_siswa,
        ];
    }
}
