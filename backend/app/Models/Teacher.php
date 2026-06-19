<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    protected $fillable = [
        'nip',
        'nuptk',
        'nik',
        'nama',
        'tahun_ajaran',
        'roles',
        'tempat_lahir',
        'tanggal_lahir',
        'jabatan',
        'alamat',
        'sapaan',
        'email',
        'telepon',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'roles' => 'array',
            'tanggal_lahir' => 'date:Y-m-d',
        ];
    }

    /**
     * @return array{id: int, nip: string, nuptk: ?string, nik: ?string, nama: string, tahunAjaran: string, role: list<string>, tempatLahir: ?string, tanggalLahir: ?string, jabatan: ?string, alamat: ?string, sapaan: ?string, email: ?string, telepon: ?string, status: string}
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'nip' => $this->nip,
            'nuptk' => $this->nuptk,
            'nik' => $this->nik,
            'nama' => $this->nama,
            'tahunAjaran' => $this->tahun_ajaran,
            'role' => $this->roles ?? [],
            'tempatLahir' => $this->tempat_lahir,
            'tanggalLahir' => $this->tanggal_lahir instanceof \DateTimeInterface
                ? $this->tanggal_lahir->format('Y-m-d')
                : (is_string($this->tanggal_lahir) ? $this->tanggal_lahir : null),
            'jabatan' => $this->jabatan,
            'alamat' => $this->alamat,
            'sapaan' => $this->sapaan,
            'email' => $this->email,
            'telepon' => $this->telepon,
            'status' => $this->status,
        ];
    }
}
