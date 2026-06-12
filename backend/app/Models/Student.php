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
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'email',
        'telepon',
    ];

    /**
     * @return array{id: int, nis: string, nama: string, tahunAjaran: string, kelas: string, jenisKelamin: string, tempatLahir: ?string, tanggalLahir: ?string, alamat: ?string, email: ?string, telepon: ?string}
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
            'tempatLahir' => $this->tempat_lahir,
            'tanggalLahir' => $this->tanggal_lahir,
            'alamat' => $this->alamat,
            'email' => $this->email,
            'telepon' => $this->telepon,
        ];
    }
}
