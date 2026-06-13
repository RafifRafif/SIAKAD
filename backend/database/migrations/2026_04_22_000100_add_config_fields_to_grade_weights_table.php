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
        Schema::table('grade_weights', function (Blueprint $table) {
            $table->json('components')->nullable()->after('attitude_weight');
            $table->json('grade_ranges')->nullable()->after('components');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade_weights', function (Blueprint $table) {
            $table->dropColumn(['components', 'grade_ranges']);
        });
    }
};
