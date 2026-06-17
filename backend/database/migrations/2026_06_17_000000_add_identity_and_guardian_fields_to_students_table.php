<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('students', 'nik')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('nik')->nullable()->after('nisn');
            });
        }

        if (! Schema::hasColumn('students', 'wali_kelas')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('wali_kelas')->nullable()->after('kelas');
            });
        }

        if (! Schema::hasColumn('students', 'asal_sekolah')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('asal_sekolah')->nullable()->after('wali_kelas');
            });
        }

        if (! Schema::hasColumn('students', 'nama_orang_tua')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('nama_orang_tua')->nullable()->after('asal_sekolah');
            });
        }
    }

    public function down(): void
    {
        $columns = array_values(array_filter(
            ['nik', 'wali_kelas', 'asal_sekolah', 'nama_orang_tua'],
            fn (string $column): bool => Schema::hasColumn('students', $column),
        ));

        if ($columns !== []) {
            Schema::table('students', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
