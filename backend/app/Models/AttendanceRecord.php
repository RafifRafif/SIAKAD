<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'student_id',
        'nis',
        'nama',
        'kelas',
        'tahun_ajaran',
        'mapel',
        'tanggal',
        'hari',
        'status',
        'waktu',
        'keterangan',
        'guru',
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
            'nama' => $this->nama,
            'kelas' => $this->kelas,
            'tahunAjaran' => $this->tahun_ajaran,
            'mapel' => $this->mapel,
            'tanggal' => $this->tanggal?->format('Y-m-d'),
            'hari' => $this->hari,
            'status' => $this->status,
            'statusCode' => $this->statusCode(),
            'waktu' => $this->waktu,
            'keterangan' => $this->keterangan,
            'guru' => $this->guru,
        ];
    }

    public function statusCode(): string
    {
        return match ($this->status) {
            'hadir', 'Hadir' => 'H',
            'alpha', 'Alpha', 'Tidak Hadir' => 'A',
            'sakit', 'Sakit' => 'S',
            'izin', 'Izin' => 'I',
            default => '-',
        };
    }
}
