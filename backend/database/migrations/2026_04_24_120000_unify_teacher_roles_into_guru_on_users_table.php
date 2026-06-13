<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'role')) {
            return;
        }

        DB::table('users')
            ->whereIn('role', ['guru-kelas', 'guru-mapel'])
            ->update(['role' => 'guru']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'guru', 'siswa') NOT NULL");
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'role')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'guru-kelas', 'guru-mapel', 'guru', 'siswa') NOT NULL");
        }

        DB::table('users')
            ->where('role', 'guru')
            ->update(['role' => 'guru-mapel']);
    }
};
