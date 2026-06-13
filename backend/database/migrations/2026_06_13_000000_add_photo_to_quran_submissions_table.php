<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('quran_submissions', 'foto_setoran')) {
            Schema::table('quran_submissions', function (Blueprint $table) {
                $table->longText('foto_setoran')->nullable()->after('keterangan');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('quran_submissions', 'foto_setoran')) {
            Schema::table('quran_submissions', function (Blueprint $table) {
                $table->dropColumn('foto_setoran');
            });
        }
    }
};
