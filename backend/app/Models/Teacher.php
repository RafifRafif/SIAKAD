<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    protected $fillable = [
        'nip',
        'nama',
        'tahun_ajaran',
        'roles',
        'email',
        'telepon',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'roles' => 'array',
        ];
    }

    /**
     * @return array{id: int, nip: string, nama: string, tahunAjaran: string, role: list<string>, email: ?string, telepon: ?string, status: string}
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'nip' => $this->nip,
            'nama' => $this->nama,
            'tahunAjaran' => $this->tahun_ajaran,
            'role' => $this->roles ?? [],
            'email' => $this->email,
            'telepon' => $this->telepon,
            'status' => $this->status,
        ];
    }
}
