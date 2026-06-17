<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'nis',
        'nisn',
        'nik',
        'nama',
        'tahun_ajaran',
        'kelas',
        'wali_kelas',
        'asal_sekolah',
        'nama_orang_tua',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'email',
        'telepon',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date:Y-m-d',
        ];
    }

    /**
     * @return array{id: int, nis: string, nisn: ?string, nik: ?string, nama: string, tahunAjaran: string, kelas: string, waliKelas: ?string, asalSekolah: ?string, namaOrangTua: ?string, jenisKelamin: string, tempatLahir: ?string, tanggalLahir: ?string, alamat: ?string, email: ?string, telepon: ?string}
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'nis' => $this->nis,
            'nisn' => $this->nisn,
            'nik' => $this->nik,
            'nama' => $this->nama,
            'tahunAjaran' => $this->tahun_ajaran,
            'kelas' => $this->kelas,
            'waliKelas' => $this->wali_kelas,
            'asalSekolah' => $this->asal_sekolah,
            'namaOrangTua' => $this->nama_orang_tua,
            'jenisKelamin' => $this->jenis_kelamin,
            'tempatLahir' => $this->tempat_lahir,
            'tanggalLahir' => $this->tanggal_lahir instanceof \DateTimeInterface
                ? $this->tanggal_lahir->format('Y-m-d')
                : (is_string($this->tanggal_lahir) ? $this->tanggal_lahir : null),
            'alamat' => $this->alamat,
            'email' => $this->email,
            'telepon' => $this->telepon,
        ];
    }
}
