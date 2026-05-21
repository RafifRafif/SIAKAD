<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrator',
                'email' => 'admin@siakad.local',
                'password' => Hash::make('admin'),
                'roles' => [User::ROLE_ADMIN],
                'email_verified_at' => now(),
            ],
        );
    }
}
