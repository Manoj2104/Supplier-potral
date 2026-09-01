<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

$tables = Schema::getConnection()->getDoctrineSchemaManager()->listTableNames();
foreach ($tables as $table) {
    echo "Table: " . $table . "\n";
}
?>
