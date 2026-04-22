<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeWeight extends Model
{
    protected $fillable = [
        'academic_year_id',
        'title',
        'knowledge_weight',
        'skill_weight',
        'attitude_weight',
        'components',
        'grade_ranges',
    ];

    protected function casts(): array
    {
        return [
            'components' => 'array',
            'grade_ranges' => 'array',
        ];
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
