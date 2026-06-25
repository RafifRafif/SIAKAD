<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('quran_submissions', 'tahun_ajaran')) {
            Schema::table('quran_submissions', function (Blueprint $table) {
                $table->string('tahun_ajaran')->nullable()->index()->after('kelas');
            });
        }

        DB::table('quran_submissions')
            ->orderBy('id')
            ->chunkById(100, function ($submissions): void {
                foreach ($submissions as $submission) {
                    $tahunAjaran = DB::table('students')
                        ->where('id', $submission->student_id)
                        ->value('tahun_ajaran');

                    if ($tahunAjaran === null || $tahunAjaran === '') {
                        $tahunAjaran = DB::table('students')
                            ->where('nis', $submission->nis)
                            ->value('tahun_ajaran');
                    }

                    if ($tahunAjaran === null || $tahunAjaran === '') {
                        continue;
                    }

                    DB::table('quran_submissions')
                        ->where('id', $submission->id)
                        ->update(['tahun_ajaran' => $tahunAjaran]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('quran_submissions', 'tahun_ajaran')) {
            Schema::table('quran_submissions', function (Blueprint $table) {
                $table->dropColumn('tahun_ajaran');
            });
        }
    }
};
