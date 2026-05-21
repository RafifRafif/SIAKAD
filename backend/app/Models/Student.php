<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'nis',
        'nama',
        'tahun_ajaran',
        'kelas',
        'jenis_kelamin',
        'email',
        'telepon',
    ];

    /**
     * @return array{id: int, nis: string, nama: string, tahunAjaran: string, kelas: string, jenisKelamin: string, email: ?string, telepon: ?string}
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'nis' => $this->nis,
            'nama' => $this->nama,
            'tahunAjaran' => $this->tahun_ajaran,
            'kelas' => $this->kelas,
            'jenisKelamin' => $this->jenis_kelamin,
            'email' => $this->email,
            'telepon' => $this->telepon,
        ];
    }
}
