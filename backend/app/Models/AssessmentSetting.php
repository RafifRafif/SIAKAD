<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssessmentSetting extends Model
{
    protected $fillable = [
        'bobot',
        'grade_ranges',
    ];

    protected function casts(): array
    {
        return [
            'bobot' => 'array',
            'grade_ranges' => 'array',
        ];
    }

    /**
     * @return array{bobot: array<int, mixed>, gradeRanges: array<int, mixed>}
     */
    public function toFrontend(): array
    {
        return [
            'bobot' => $this->bobot ?? [],
            'gradeRanges' => $this->grade_ranges ?? [],
        ];
    }
}
