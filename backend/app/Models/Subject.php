<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $fillable = [
        'nama',
        'tahun_ajaran',
    ];

    /**
     * @return array{id: int, nama: string, tahunAjaran: string}
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'tahunAjaran' => $this->tahun_ajaran,
        ];
    }
}
