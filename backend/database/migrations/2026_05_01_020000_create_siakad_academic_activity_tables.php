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
        Schema::create('student_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('nis');
            $table->string('nama');
            $table->string('kelas');
            $table->string('tahun_ajaran');
            $table->string('mapel');
            $table->string('jenis_penilaian');
            $table->unsignedTinyInteger('nilai');
            $table->string('guru')->nullable();
            $table->date('tanggal')->nullable();
            $table->timestamps();
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('nis');
            $table->string('nama');
            $table->string('kelas');
            $table->string('tahun_ajaran');
            $table->string('mapel')->nullable();
            $table->date('tanggal');
            $table->string('hari')->nullable();
            $table->string('status');
            $table->string('waktu')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('guru')->nullable();
            $table->timestamps();

            $table->unique(['nis', 'mapel', 'tanggal'], 'attendance_records_unique_entry');
        });

        Schema::create('quran_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('nis');
            $table->string('nama');
            $table->string('kelas')->nullable();
            $table->date('tanggal');
            $table->string('surah');
            $table->unsignedInteger('ayat_mulai');
            $table->unsignedInteger('ayat_selesai');
            $table->string('penilaian');
            $table->text('keterangan')->nullable();
            $table->unsignedTinyInteger('progress_juz')->default(0);
            $table->string('guru')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quran_submissions');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('student_grades');
    }
};
