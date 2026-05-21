<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentAchievement extends Model
{
    protected $fillable = [
        'student_id',
        'nis',
        'judul',
        'keterangan',
        'tanggal',
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
            'studentId' => $this->student_id,
            'nis' => $this->nis,
            'judul' => $this->judul,
            'keterangan' => $this->keterangan,
            'tanggal' => $this->tanggal?->format('Y-m-d'),
        ];
    }
}
