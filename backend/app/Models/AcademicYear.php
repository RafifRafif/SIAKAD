<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    protected $fillable = [
        'nama',
        'semester',
        'tanggal_mulai',
        'tanggal_selesai',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date:Y-m-d',
            'tanggal_selesai' => 'date:Y-m-d',
        ];
    }

    /**
     * @return array{id: int, nama: string, semester: string, tanggalMulai: string, tanggalSelesai: string, status: string}
     */
    public function toFrontend(): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'semester' => $this->semester,
            'tanggalMulai' => $this->tanggal_mulai?->format('Y-m-d'),
            'tanggalSelesai' => $this->tanggal_selesai?->format('Y-m-d'),
            'status' => $this->status,
        ];
    }
}
