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
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('semester');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->string('status');
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('nis')->unique();
            $table->string('nama');
            $table->string('tahun_ajaran');
            $table->string('kelas');
            $table->string('jenis_kelamin');
            $table->string('email')->nullable();
            $table->string('telepon')->nullable();
            $table->timestamps();
        });

        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->string('nip')->unique();
            $table->string('nama');
            $table->string('tahun_ajaran');
            $table->json('roles');
            $table->string('email')->nullable();
            $table->string('telepon')->nullable();
            $table->string('status');
            $table->timestamps();
        });

        Schema::create('school_classes', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('tahun_ajaran');
            $table->string('kelompok');
            $table->string('wali_kelas')->nullable();
            $table->unsignedInteger('jumlah_siswa')->default(0);
            $table->timestamps();
        });

        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('tahun_ajaran');
            $table->timestamps();
        });

        Schema::create('learning_assignments', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('tahun_ajaran');
            $table->string('guru_pengampu');
            $table->string('kelas');
            $table->string('kelompok');
            $table->timestamps();
        });

        Schema::create('assessment_settings', function (Blueprint $table) {
            $table->id();
            $table->json('bobot');
            $table->json('grade_ranges');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_settings');
        Schema::dropIfExists('learning_assignments');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('school_classes');
        Schema::dropIfExists('teachers');
        Schema::dropIfExists('students');
        Schema::dropIfExists('academic_years');
    }
};
