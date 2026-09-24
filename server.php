<?php

/**
 * Laravel - Ultra-High-Performance Static Asset & Parallel Request Server
 *
 * @package  Laravel
 * @author   Taylor Otwell <taylor@laravel.com>
 */

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

// If the file exists in the public directory, serve it directly with high-performance caching
if ($uri !== '/' && is_file($filePath = __DIR__.'/public'.$uri)) {
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimes = [
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'svg'   => 'image/svg+xml',
        'webp'  => 'image/webp',
        'avif'  => 'image/avif',
        'ico'   => 'image/x-icon',
        'css'   => 'text/css; charset=utf-8',
        'js'    => 'application/javascript; charset=utf-8',
        'json'  => 'application/json',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
    ];

    $contentType = $mimes[$ext] ?? (function_exists('mime_content_type') ? mime_content_type($filePath) : 'application/octet-stream');
    $fileSize = filesize($filePath);
    $mtime = filemtime($filePath);
    $etag = sprintf('"%x-%x"', $mtime, $fileSize);
    $lastModified = gmdate('D, d M Y H:i:s ', $mtime) . 'GMT';

    $isImage = in_array($ext, ['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'avif']);
    $isStaticAsset = in_array($ext, ['js', 'css', 'woff', 'woff2', 'ttf', 'webp', 'png', 'jpg', 'jpeg', 'svg', 'ico']);

    // HTTP 304 Revalidation handling (Supports weak ETags W/ and RFC-compliant matching)
    $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
    $ifModifiedSince = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? '';

    $cleanClientEtag = trim(preg_replace('/^W\//i', '', trim($ifNoneMatch)), '" \t\n\r\0\x0B');
    $cleanServerEtag = trim($etag, '"');

    $isEtagMatch = (!empty($cleanClientEtag) && ($cleanClientEtag === $cleanServerEtag || str_contains($ifNoneMatch, $cleanServerEtag)));
    $isModifiedMatch = (!empty($ifModifiedSince) && @strtotime($ifModifiedSince) >= $mtime);

    if ($isEtagMatch || $isModifiedMatch) {
        header('HTTP/1.1 304 Not Modified');
        header('ETag: ' . $etag);
        header('Last-Modified: ' . $lastModified);
        header('Cache-Control: public, max-age=31536000, immutable');
        exit;
    }

    header('Content-Type: ' . $contentType);
    header('ETag: ' . $etag);
    header('Last-Modified: ' . $lastModified);

    if ($isStaticAsset) {
        header('Cache-Control: public, max-age=31536000, immutable');
        header('X-Content-Type-Options: nosniff');
    } else {
        header('Cache-Control: public, max-age=86400');
    }

    // Serve pre-compressed Gzip version for large assets if browser supports it
    $acceptEncoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
    $supportsGzip = str_contains($acceptEncoding, 'gzip');
    $gzFilePath = $filePath . '.gz';

    if ($supportsGzip && is_file($gzFilePath) && filemtime($gzFilePath) >= $mtime) {
        header('Content-Encoding: gzip');
        header('Content-Length: ' . filesize($gzFilePath));
        header('Vary: Accept-Encoding');
        readfile($gzFilePath);
        exit;
    }

    header('Content-Length: ' . $fileSize);
    readfile($filePath);
    exit;
}

require_once __DIR__.'/public/index.php';
