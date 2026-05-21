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
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('telepon')->nullable();
            $table->text('alamat')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->timestamps();
        });

        Schema::create('student_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('nis')->index();
            $table->string('guru')->nullable();
            $table->date('tanggal')->nullable();
            $table->text('catatan');
            $table->timestamps();
        });

        Schema::create('student_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('nis')->index();
            $table->string('judul');
            $table->text('keterangan')->nullable();
            $table->date('tanggal')->nullable();
            $table->timestamps();
        });

        Schema::create('class_agendas', function (Blueprint $table) {
            $table->id();
            $table->string('kelas')->nullable()->index();
            $table->date('tanggal')->index();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });

        Schema::create('class_reminders', function (Blueprint $table) {
            $table->id();
            $table->string('kelas')->nullable()->index();
            $table->date('tanggal')->nullable()->index();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('learning_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('learning_assignment_id')
                ->nullable()
                ->constrained('learning_assignments')
                ->nullOnDelete();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->string('kelas')->nullable()->index();
            $table->string('mapel')->nullable()->index();
            $table->string('guru')->nullable()->index();
            $table->date('tanggal')->nullable()->index();
            $table->string('status')->default('Aktif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_tasks');
        Schema::dropIfExists('class_reminders');
        Schema::dropIfExists('class_agendas');
        Schema::dropIfExists('student_achievements');
        Schema::dropIfExists('student_notes');
        Schema::dropIfExists('user_profiles');
    }
};
