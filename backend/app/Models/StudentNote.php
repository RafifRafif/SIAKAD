<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentNote extends Model
{
    protected $fillable = [
        'student_id',
        'nis',
        'guru',
        'tanggal',
        'catatan',
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
            'guru' => $this->guru,
            'tanggal' => $this->tanggal?->format('Y-m-d'),
            'catatan' => $this->catatan,
        ];
    }
}
