<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassAgenda extends Model
{
    protected $fillable = [
        'kelas',
        'tanggal',
        'judul',
        'deskripsi',
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
            'kelas' => $this->kelas,
            'tanggal' => $this->tanggal?->format('Y-m-d'),
            'judul' => $this->judul,
            'deskripsi' => $this->deskripsi,
        ];
    }
}
