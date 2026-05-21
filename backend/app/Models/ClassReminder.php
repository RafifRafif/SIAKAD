<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassReminder extends Model
{
    protected $fillable = [
        'kelas',
        'tanggal',
        'judul',
        'deskripsi',
        'status',
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
            'status' => $this->status,
        ];
    }
}
