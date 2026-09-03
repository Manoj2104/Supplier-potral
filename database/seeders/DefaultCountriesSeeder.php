<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\State;
use Illuminate\Database\Seeder;

class DefaultCountriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        try {
            $countriesPath = storage_path('countries/countries.json');
            if (file_exists($countriesPath)) {
                $content = file_get_contents($countriesPath);
                $decoded = json_decode($content, true);
                if (!empty($decoded['countries'])) {
                    Country::insert($decoded['countries']);
                }
            }

            $statesPath = storage_path('countries/states.json');
            if (file_exists($statesPath)) {
                $content = file_get_contents($statesPath);
                $decoded = json_decode($content, true);
                if (!empty($decoded['states'])) {
                    State::insert($decoded['states']);
                }
            }
        } catch (\Throwable $e) {
            \Log::warning('DefaultCountriesSeeder non-fatal notice: ' . $e->getMessage());
        }
    }
}
