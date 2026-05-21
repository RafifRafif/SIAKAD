<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningTask extends Model
{
    protected $fillable = [
        'learning_assignment_id',
        'judul',
        'deskripsi',
        'kelas',
        'mapel',
        'guru',
        'tanggal',
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
            'learningAssignmentId' => $this->learning_assignment_id,
            'judul' => $this->judul,
            'deskripsi' => $this->deskripsi,
            'kelas' => $this->kelas,
            'mapel' => $this->mapel,
            'guru' => $this->guru,
            'tanggal' => $this->tanggal?->format('Y-m-d'),
            'status' => $this->status,
        ];
    }
}
