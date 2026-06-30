<?php
declare(strict_types=1);

return [
    'database' => [
        // Leave empty to use JSON fallback storage in /storage.
        // Example: mysql:host=127.0.0.1;port=3306;dbname=shiguang_travel;charset=utf8mb4
        'dsn' => getenv('SHIGUANG_DB_DSN') ?: 'mysql:host=220.160.32.216;port=3306;dbname=shiguang_travel;charset=utf8mb4',
        'user' => getenv('SHIGUANG_DB_USER') ?: 'shiguang_travel',
        'password' => getenv('SHIGUANG_DB_PASSWORD') ?: 'eMerG3dnbziPX8EJ',
    ],
];
