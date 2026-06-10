<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropUnique('attendance_records_unique_entry');
            $table->index(['nis', 'tanggal'], 'attendance_records_nis_tanggal_index');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropIndex('attendance_records_nis_tanggal_index');
            $table->unique(['nis', 'mapel', 'tanggal'], 'attendance_records_unique_entry');
        });
    }
};
