<?php
$dir = new RecursiveDirectoryIterator('.');
foreach (new RecursiveIteratorIterator($dir) as $file) {
    if ($file->isFile() && ($file->getExtension() === 'php' || $file->getExtension() === 'js' || $file->getExtension() === 'vue')) {
        $content = file_get_contents($file->getPathname());
        if (strpos($content, 'Warehouse Receiving Orders') !== false || strpos($content, 'Inbound Receiving Queue') !== false) {
            echo "Found in: " . $file->getPathname() . "\n";
        }
    }
}
?>
