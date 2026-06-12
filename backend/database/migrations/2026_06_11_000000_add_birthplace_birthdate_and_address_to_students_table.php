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
        if (! Schema::hasColumn('students', 'tempat_lahir')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('tempat_lahir')->nullable()->after('jenis_kelamin');
            });
        }

        if (! Schema::hasColumn('students', 'tanggal_lahir')) {
            Schema::table('students', function (Blueprint $table) {
                $table->date('tanggal_lahir')->nullable()->after('tempat_lahir');
            });
        }

        if (! Schema::hasColumn('students', 'alamat')) {
            Schema::table('students', function (Blueprint $table) {
                $table->text('alamat')->nullable()->after('tanggal_lahir');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $columns = array_values(array_filter(
            ['tempat_lahir', 'tanggal_lahir', 'alamat'],
            fn (string $column): bool => Schema::hasColumn('students', $column),
        ));

        if ($columns !== []) {
            Schema::table('students', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
