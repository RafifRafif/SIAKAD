<?php

use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        Student::query()->with('user')->get()->each(function (Student $student): void {
            $user = $student->user;

            if (! $user) {
                $user = User::create([
                    'name' => $student->name,
                    'username' => $student->nis,
                    'email' => $student->email,
                    'phone' => $student->phone,
                    'role' => 'siswa',
                    'password' => Hash::make($student->nis),
                ]);

                $student->update(['user_id' => $user->id]);

                return;
            }

            $user->update([
                'name' => $student->name,
                'username' => $student->nis,
                'email' => $student->email,
                'phone' => $student->phone,
                'role' => 'siswa',
                'password' => Hash::make($student->nis),
            ]);
        });

        Teacher::query()->with('user')->get()->each(function (Teacher $teacher): void {
            $user = $teacher->user;

            if (! $user) {
                $user = User::create([
                    'name' => $teacher->name,
                    'username' => $teacher->nip,
                    'email' => $teacher->email,
                    'phone' => $teacher->phone,
                    'role' => 'guru',
                    'password' => Hash::make($teacher->nip),
                ]);

                $teacher->update(['user_id' => $user->id]);

                return;
            }

            $user->update([
                'name' => $teacher->name,
                'username' => $teacher->nip,
                'email' => $teacher->email,
                'phone' => $teacher->phone,
                'role' => 'guru',
                'password' => Hash::make($teacher->nip),
            ]);
        });
    }

    public function down(): void
    {
        //
    }
};
