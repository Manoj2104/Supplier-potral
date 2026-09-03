<?php

namespace Database\Seeders;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DefaultUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::whereName('admin')->first();

        $users = [
            [
                'first_name' => 'Admin',
                'last_name' => 'Suguna',
                'email' => 'manoj2104s@gmail.com',
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make('8610006544'),
            ],
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => 'admin@infy-pos.com',
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make('123456'),
            ],
            [
                'first_name' => 'Admin',
                'last_name' => 'Suguna',
                'email' => 'admin@infypos.com',
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make('123456'),
            ],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            if ($adminRole && $user) {
                $user->assignRole($adminRole);
            }
        }
    }
}
