<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'app_name',
                'value' => 'Akuntansi',
                'type' => 'text',
                'description' => 'Nama Aplikasi'
            ],
            [
                'key' => 'app_logo',
                'value' => '/1.png',
                'type' => 'image',
                'description' => 'Logo Aplikasi'
            ],
            [
                'key' => 'app_favicon',
                'value' => '/favicon.ico',
                'type' => 'image',
                'description' => 'Favicon Aplikasi'
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
