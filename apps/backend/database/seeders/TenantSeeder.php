<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Device;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        // Default tenant
        $tenant = Tenant::firstOrCreate(
            ['domain' => 'localhost'],
            [
                'name' => 'TrensAI CRM',
                'slug' => 'trensai-crm',
                'domain' => 'localhost',
                'status' => 'active',
                'settings' => json_encode([
                    'ai_enabled' => true,
                    'ai_provider' => 'openai',
                    'auto_reply' => false,
                    'timezone' => 'Asia/Jakarta',
                    'language' => 'id',
                ]),
            ]
        );

        // Admin user
        User::firstOrCreate(
            ['email' => 'admin@trensai.local'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Admin TrensAI',
                'email' => 'admin@trensai.local',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $admin = User::where('email', 'admin@trensai.local')->first();

        Device::firstOrCreate(
            ['phone_number' => '628123456789'],
            [
                'tenant_id' => $tenant->id,
                'user_id' => $admin?->id,
                'device_name' => 'Default Device',
                'status' => 'disconnected',
                'session_id' => 'device-default-1',
                'settings' => json_encode([
                    'auto_reconnect' => true,
                    'webhook_enabled' => true,
                ]),
            ]
        );

        $this->command->info('✅ Default tenant & admin user created');
        $this->command->info('   Email: admin@trensai.local');
        $this->command->info('   Password: password');
        $this->command->warn('   ⚠️  Ganti password setelah login pertama!');
        $this->command->info('   Device ID will be created as 1 on a fresh database');
    }
}
