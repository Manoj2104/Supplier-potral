<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname=pos", "root", "");
    echo "SUCCESSFULLY CONNECTED TO MYSQL DATABASE ON PORT 3307!\n";
} catch (Exception $e) {
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=pos", "root", "");
        echo "SUCCESSFULLY CONNECTED TO MYSQL DATABASE ON PORT 3306!\n";
    } catch (Exception $ex) {
        echo "FAILED TO CONNECT: " . $ex->getMessage() . "\n";
    }
}
