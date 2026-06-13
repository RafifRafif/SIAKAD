<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('students', 'guru_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->foreignId('guru_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('teachers')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('students', 'nisn')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('nisn')->nullable()->unique()->after('nis');
            });
        }

        if (! Schema::hasColumn('students', 'tempat_tanggal_lahir')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('tempat_tanggal_lahir')->nullable()->after('jenis_kelamin');
            });
        }

        if (! Schema::hasColumn('students', 'alamat')) {
            Schema::table('students', function (Blueprint $table) {
                $table->text('alamat')->nullable()->after('telepon');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('students', 'guru_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropConstrainedForeignId('guru_id');
            });
        }

        if (Schema::hasColumn('students', 'nisn')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropUnique('students_nisn_unique');
                $table->dropColumn('nisn');
            });
        }

        $columns = array_values(array_filter(
            ['tempat_tanggal_lahir', 'alamat'],
            fn (string $column): bool => Schema::hasColumn('students', $column),
        ));

        if ($columns !== []) {
            Schema::table('students', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
