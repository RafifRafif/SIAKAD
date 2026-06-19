<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table): void {
            $table->string('nuptk')->nullable()->after('nip');
            $table->string('nik')->nullable()->after('nuptk');
            $table->string('tempat_lahir')->nullable()->after('roles');
            $table->date('tanggal_lahir')->nullable()->after('tempat_lahir');
            $table->string('jabatan')->nullable()->after('tanggal_lahir');
            $table->text('alamat')->nullable()->after('jabatan');
            $table->string('sapaan')->nullable()->after('alamat');
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table): void {
            $table->dropColumn([
                'nuptk',
                'nik',
                'tempat_lahir',
                'tanggal_lahir',
                'jabatan',
                'alamat',
                'sapaan',
            ]);
        });
    }
};
