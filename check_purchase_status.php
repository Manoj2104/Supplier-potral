<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$purchase = DB::table('purchases')->where('id', 47)->first();
echo json_encode($purchase, JSON_PRETTY_PRINT) . "\n";
?>
