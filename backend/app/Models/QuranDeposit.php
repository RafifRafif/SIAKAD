<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuranDeposit extends Model
{
    protected $fillable = [
        'teacher_id',
        'student_id',
        'deposit_date',
        'surah',
        'verse_start',
        'verse_end',
        'assessment',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'deposit_date' => 'date',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
