<?php
declare(strict_types=1);

function shiguang_boot_runtime(): void
{
    $ca = __DIR__ . '/runtime/php/extras/ssl/cacert.pem';
    if (is_file($ca)) {
        ini_set('curl.cainfo', $ca);
        ini_set('openssl.cafile', $ca);
    }

    // 自动加载 .env 文件（若存在）
    $envPath = __DIR__ . '/.env';
    if (is_file($envPath) && is_readable($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) continue;
            if (str_contains($line, '=')) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                // 移除可选引号
                if ((str_starts_with($value, '"') && str_ends_with($value, '"'))
                    || (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }
                if ($key !== '') {
                    putenv($key . '=' . $value);
                    $_ENV[$key] = $value;
                }
            }
        }
    }
}

shiguang_boot_runtime();

function shiguang_config(): array
{
    $path = __DIR__ . '/config.php';
    if (is_file($path)) {
        $config = require $path;
        if (is_array($config)) {
            return $config;
        }
    }

    return ['database' => ['dsn' => '', 'user' => 'root', 'password' => '']];
}

function shiguang_pdo(): ?PDO
{
    static $pdo = null;
    static $checked = false;

    if ($checked) {
        return $pdo;
    }
    $checked = true;

    $database = shiguang_config()['database'] ?? [];
    $dsn = (string)($database['dsn'] ?? '');
    if ($dsn === '' || !class_exists(PDO::class) || !in_array('mysql', PDO::getAvailableDrivers(), true)) {
        return null;
    }

    try {
        $pdo = new PDO($dsn, (string)($database['user'] ?? ''), (string)($database['password'] ?? ''), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable) {
        $pdo = null;
    }

    return $pdo;
}

function shiguang_mysql_enabled(): bool
{
    return shiguang_pdo() instanceof PDO;
}

function shiguang_storage_dir(): string
{
    return __DIR__ . '/storage';
}

function shiguang_read_json_file(string $path, array $fallback = []): array
{
    if (!is_file($path)) {
        return $fallback;
    }
    $decoded = json_decode((string)file_get_contents($path), true);
    return is_array($decoded) ? $decoded : $fallback;
}

function shiguang_write_json_file(string $path, array $value): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    file_put_contents($path, json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
}

function shiguang_db_json_decode(?string $value, array $fallback = []): array
{
    $decoded = json_decode((string)$value, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function shiguang_destinations(): array
{
    return [
        [
            'id' => 'swiss',
            'name' => '瑞士·因特拉肯',
            'country' => '瑞士',
            'region' => '阿尔卑斯',
            'tags' => ['雪山湖泊', '户外', '摄影', '火车', '轻徒步'],
            'budget' => '舒适',
            'season' => '5-10月 / 12-2月',
            'days' => 8,
            'intro' => '雪山、湖泊与登山铁路组成的高完成度自然路线。',
            'summary' => '适合把景观放在第一位，又希望交通组织稳定的人。',
            'img' => 'alps',
            'weight' => 95,
            'lng' => 7.8632,
            'lat' => 46.6863,
        ],
        [
            'id' => 'iceland',
            'name' => '冰岛极光环岛',
            'country' => '冰岛',
            'region' => '北大西洋',
            'tags' => ['极地', '瀑布', '黑沙滩', '自驾', '极光'],
            'budget' => '舒适',
            'season' => '9-3月',
            'days' => 10,
            'intro' => '冰川、黑沙滩、瀑布和极光构成高能自然路线。',
            'summary' => '适合风景优先和摄影优先，但天气与预算需要认真管理。',
            'img' => 'aurora',
            'weight' => 86,
            'lng' => -21.9426,
            'lat' => 64.1466,
        ],
        [
            'id' => 'morocco',
            'name' => '摩洛哥·马拉喀什',
            'country' => '摩洛哥',
            'region' => '北非',
            'tags' => ['红色古城', '市集', '沙漠', '人文', '摄影'],
            'budget' => '均衡',
            'season' => '3-5月 / 9-11月',
            'days' => 9,
            'intro' => '红城、阿特拉斯山和撒哈拉边缘构成强烈的人文路线。',
            'summary' => '适合想要异域感、色彩和市集体验的人。',
            'img' => 'marrakech',
            'weight' => 92,
            'lng' => -7.9811,
            'lat' => 31.6295,
        ],
        [
            'id' => 'nz',
            'name' => '新西兰·南岛',
            'country' => '新西兰',
            'region' => '大洋洲',
            'tags' => ['湖泊', '雪山', '自驾', '星空', '自然'],
            'budget' => '舒适',
            'season' => '11-4月',
            'days' => 10,
            'intro' => '皇后镇、库克山和峡湾把自然路线的层次拉满。',
            'summary' => '适合重视风景密度、愿意自驾或包车的人。',
            'img' => 'lake',
            'weight' => 90,
            'lng' => 170.1435,
            'lat' => -45.0312,
        ],
        [
            'id' => 'lisbon',
            'name' => '葡萄牙·波尔图',
            'country' => '葡萄牙',
            'region' => '欧洲西南',
            'tags' => ['港口城市', '葡萄酒', '电车', '老城', '美食'],
            'budget' => '均衡',
            'season' => '4-6月 / 9-10月',
            'days' => 7,
            'intro' => '海风、坡道、瓷砖外墙和河岸夜色组成轻快城市路线。',
            'summary' => '适合想要欧洲城市感但又不想被高消费压住的人。',
            'img' => 'porto',
            'weight' => 88,
            'lng' => -8.6291,
            'lat' => 41.1579,
        ],
        [
            'id' => 'dali',
            'name' => '大理·洱海慢游',
            'country' => '中国',
            'region' => '云南',
            'tags' => ['湖泊', '山风', '松弛', '小众', '民宿'],
            'budget' => '省钱',
            'season' => '3-6月 / 9-11月',
            'days' => 4,
            'intro' => '苍山洱海之间的低压生活，适合恢复感旅行。',
            'summary' => '大理的好不在景点密度，而在每天醒来都可以把行程放轻。',
            'img' => 'dali',
            'weight' => 84,
            'lng' => 100.2676,
            'lat' => 25.6065,
        ],
    ];
}

function shiguang_settings_path(): string
{
    return shiguang_storage_dir() . '/integrations.json';
}

function shiguang_default_settings(): array
{
    return [
        'map' => [
            'provider' => '高德地图',
            'jsKey' => getenv('AMAP_JS_KEY') ?: '94c9fdb9cd54e8a08eaba1c5a280ac79',
            'securityJsCode' => getenv('AMAP_SECURITY_JSCODE') ?: 'cbc23e323047ee6c0bb5fcda3d122fbb',
            'webServiceKey' => getenv('AMAP_WEB_SERVICE_KEY') ?: '901bdc1b83655b2a138b9e8215dd5456',
        ],
        'unsplash' => [
            'applicationId' => getenv('UNSPLASH_APPLICATION_ID') ?: '970970',
            'accessKey' => getenv('UNSPLASH_ACCESS_KEY') ?: 'p72aH1yRgkf9np7iTquSkfzSjlQqJNbRPOW77MhcwVI',
            'secretKey' => getenv('UNSPLASH_SECRET_KEY') ?: 'M2DheKgljJMeRCj6yy7Fp2HvehlrrX3ojtIVHnQo_3w',
        ],
        'media' => [
            'pexelsApiKey' => getenv('PEXELS_API_KEY') ?: '',
            'pixabayApiKey' => getenv('PIXABAY_API_KEY') ?: '',
            'tencentSecretId' => getenv('TENCENTCLOUD_SECRET_ID') ?: '',
            'tencentSecretKey' => getenv('TENCENTCLOUD_SECRET_KEY') ?: '',
            'apihzId' => getenv('APIHZ_ID') ?: '10018086',
            'apihzKey' => getenv('APIHZ_KEY') ?: 'eb45be5ce77e7c685ae90d13f7d4f1f6',
        ],
        'ai' => [
            'defaultProvider' => getenv('SHIGUANG_AI_PROVIDER') ?: 'deepseek',
            'deepseek' => [
                'apiKey' => getenv('DEEPSEEK_API_KEY') ?: 'sk-25fbc27a97e84846a967d7d089300c13',
                'baseUrl' => getenv('DEEPSEEK_BASE_URL') ?: 'https://api.deepseek.com',
                'model' => getenv('DEEPSEEK_MODEL') ?: 'deepseek-chat',
            ],
            'doubao' => [
                'apiKey' => getenv('DOUBAO_API_KEY') ?: '',
                'baseUrl' => getenv('DOUBAO_BASE_URL') ?: 'https://ark.cn-beijing.volces.com/api/v3',
                'model' => getenv('DOUBAO_MODEL') ?: 'doubao-seed-1-6-250615',
            ],
            'openaiCompatible' => [
                'apiKey' => getenv('OPENAI_COMPATIBLE_API_KEY') ?: '',
                'baseUrl' => getenv('OPENAI_COMPATIBLE_BASE_URL') ?: '',
                'model' => getenv('OPENAI_COMPATIBLE_MODEL') ?: '',
            ],
        ],
        'dify' => [
            'enabled' => filter_var(getenv('DIFY_ENABLED') ?: 'true', FILTER_VALIDATE_BOOL),
            'baseUrl' => rtrim(getenv('DIFY_BASE_URL') ?: 'http://220.160.32.216:8088/v1', '/'),
            'chatflowApiKey' => getenv('DIFY_CHATFLOW_API_KEY') ?: 'app-ZxrCWUZR8poo6K7Ulf5vOrwm',
            'tripWorkflowApiKey' => getenv('DIFY_TRIP_WORKFLOW_API_KEY') ?: 'app-qKbi8VhMdj6GUwSY7fnZgbar',
            'recommendWorkflowApiKey' => getenv('DIFY_RECOMMEND_WORKFLOW_API_KEY') ?: 'app-qKbi8VhMdj6GUwSY7fnZgbar',
            'preferenceWorkflowApiKey' => getenv('DIFY_PREFERENCE_WORKFLOW_API_KEY') ?: 'app-iO3ocu80zA50n0j8YcPFR544',
            'detailWorkflowApiKey' => getenv('DIFY_DETAIL_WORKFLOW_API_KEY') ?: 'app-rBI4Z9g9FMA7wHYOETON8AEa',
            'taskWorkflowApiKey' => getenv('DIFY_TASK_WORKFLOW_API_KEY') ?: 'app-dXdj1NlIfKgsYdO5uqjKywr7',
            'timeout' => max(5, min(300, (int)(getenv('DIFY_TIMEOUT') ?: 300))),
        ],
    ];
}

function shiguang_normalize_settings(array $settings): array
{
    $settings['map']['provider'] = '高德地图';
    $settings['map']['jsKey'] = !empty($settings['map']['jsKey']) ? $settings['map']['jsKey'] : ($settings['map']['jsId'] ?? '');
    $settings['map']['securityJsCode'] = !empty($settings['map']['securityJsCode']) ? $settings['map']['securityJsCode'] : ($settings['map']['securityKey'] ?? '');
    $settings['map']['webServiceKey'] = !empty($settings['map']['webServiceKey']) ? $settings['map']['webServiceKey'] : ($settings['map']['webId'] ?? '');
    unset($settings['map']['jsId'], $settings['map']['securityKey'], $settings['map']['webId']);

    $settings['ai'] = array_replace_recursive(shiguang_default_settings()['ai'], $settings['ai'] ?? []);

    // 补齐 dify 默认值并规范化
    $settings['dify'] = array_replace_recursive(
        shiguang_default_settings()['dify'],
        $settings['dify'] ?? []
    );
    $settings['dify']['baseUrl'] = rtrim(trim((string)($settings['dify']['baseUrl'] ?? '')), '/');
    $settings['dify']['timeout'] = max(5, min(300, (int)($settings['dify']['timeout'] ?? 90)));

    return $settings;
}

function shiguang_filter_empty_strings(array $data): array
{
    $filtered = [];
    foreach ($data as $key => $value) {
        if (is_array($value)) {
            $filtered[$key] = shiguang_filter_empty_strings($value);
        } elseif ($value !== '' && $value !== null) {
            $filtered[$key] = $value;
        }
    }
    return $filtered;
}

function shiguang_settings(): array
{
    $settings = shiguang_default_settings();
    $pdo = shiguang_pdo();

    if ($pdo instanceof PDO) {
        $stmt = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = :key');
        $stmt->execute(['key' => 'integrations']);
        $saved = $stmt->fetchColumn();
        if (is_string($saved) && $saved !== '') {
            return shiguang_normalize_settings(array_replace_recursive($settings, shiguang_filter_empty_strings(shiguang_db_json_decode($saved))));
        }
    }

    return shiguang_normalize_settings(array_replace_recursive($settings, shiguang_filter_empty_strings(shiguang_read_json_file(shiguang_settings_path()))));
}

function shiguang_public_settings(): array
{
    $settings = shiguang_settings();
    return [
        'map' => [
            'provider' => '高德地图',
            'jsKey' => $settings['map']['jsKey'] ?? '',
            'securityJsCode' => $settings['map']['securityJsCode'] ?? '',
            'configured' => !empty($settings['map']['jsKey']),
        ],
        'unsplash' => [
            'applicationId' => $settings['unsplash']['applicationId'] ?? '',
            'accessKey' => $settings['unsplash']['accessKey'] ?? '',
            'configured' => !empty($settings['unsplash']['accessKey']),
        ],
        'media' => [
            'pexelsConfigured' => !empty($settings['media']['pexelsApiKey']),
            'pixabayConfigured' => !empty($settings['media']['pixabayApiKey']),
            'tencentWimgsConfigured' => !empty($settings['media']['tencentSecretId']) && !empty($settings['media']['tencentSecretKey']),
            'apihzBaiduConfigured' => !empty($settings['media']['apihzId']) && !empty($settings['media']['apihzKey']),
        ],
        'dify' => [
            'enabled' => !empty($settings['dify']['enabled']),
            'baseUrl' => $settings['dify']['baseUrl'] ?? '',
            'tripWorkflowApiKey' => (string)($settings['dify']['tripWorkflowApiKey'] ?? ''),
            'recommendWorkflowApiKey' => (string)($settings['dify']['recommendWorkflowApiKey'] ?? ''),
            'preferenceWorkflowApiKey' => (string)($settings['dify']['preferenceWorkflowApiKey'] ?? ''),
            'detailWorkflowApiKey' => (string)($settings['dify']['detailWorkflowApiKey'] ?? ''),
            'chatflowApiKey' => (string)($settings['dify']['chatflowApiKey'] ?? ''),
            'taskWorkflowApiKey' => (string)($settings['dify']['taskWorkflowApiKey'] ?? ''),
            'configured' => !empty($settings['dify']['enabled'])
                && !empty($settings['dify']['baseUrl'])
                && (!empty($settings['dify']['chatflowApiKey'])
                    || !empty($settings['dify']['taskWorkflowApiKey'])
                    || !empty($settings['dify']['tripWorkflowApiKey'])
                    || !empty($settings['dify']['recommendWorkflowApiKey'])
                    || !empty($settings['dify']['preferenceWorkflowApiKey'])
                    || !empty($settings['dify']['detailWorkflowApiKey'])),
            'chatflowConfigured' => !empty($settings['dify']['chatflowApiKey']),
        ],
    ];
}

function shiguang_save_settings(array $input): array
{
    $current = shiguang_settings();
    $next = array_replace_recursive($current, [
        'map' => [
            'provider' => '高德地图',
            'jsKey' => trim((string)($input['map']['jsKey'] ?? $input['map']['jsId'] ?? $current['map']['jsKey'] ?? '')),
            'securityJsCode' => trim((string)($input['map']['securityJsCode'] ?? $input['map']['securityKey'] ?? $current['map']['securityJsCode'] ?? '')),
            'webServiceKey' => trim((string)($input['map']['webServiceKey'] ?? $input['map']['webId'] ?? $current['map']['webServiceKey'] ?? '')),
        ],
        'unsplash' => [
            'applicationId' => trim((string)($input['unsplash']['applicationId'] ?? $current['unsplash']['applicationId'] ?? '')),
            'accessKey' => trim((string)($input['unsplash']['accessKey'] ?? $current['unsplash']['accessKey'] ?? '')),
            'secretKey' => trim((string)($input['unsplash']['secretKey'] ?? $current['unsplash']['secretKey'] ?? '')),
        ],
        'media' => [
            'pexelsApiKey' => trim((string)($input['media']['pexelsApiKey'] ?? $current['media']['pexelsApiKey'] ?? '')),
            'pixabayApiKey' => trim((string)($input['media']['pixabayApiKey'] ?? $current['media']['pixabayApiKey'] ?? '')),
            'tencentSecretId' => trim((string)($input['media']['tencentSecretId'] ?? $current['media']['tencentSecretId'] ?? '')),
            'tencentSecretKey' => trim((string)($input['media']['tencentSecretKey'] ?? $current['media']['tencentSecretKey'] ?? '')),
            'apihzId' => trim((string)($input['media']['apihzId'] ?? $current['media']['apihzId'] ?? '')),
            'apihzKey' => trim((string)($input['media']['apihzKey'] ?? $current['media']['apihzKey'] ?? '')),
        ],
        'ai' => [
            'defaultProvider' => trim((string)($input['ai']['defaultProvider'] ?? $current['ai']['defaultProvider'] ?? 'deepseek')),
            'deepseek' => [
                'apiKey' => trim((string)($input['ai']['deepseek']['apiKey'] ?? $current['ai']['deepseek']['apiKey'] ?? '')),
                'baseUrl' => rtrim(trim((string)($input['ai']['deepseek']['baseUrl'] ?? $current['ai']['deepseek']['baseUrl'] ?? 'https://api.deepseek.com')), '/'),
                'model' => trim((string)($input['ai']['deepseek']['model'] ?? $current['ai']['deepseek']['model'] ?? 'deepseek-chat')),
            ],
            'doubao' => [
                'apiKey' => trim((string)($input['ai']['doubao']['apiKey'] ?? $current['ai']['doubao']['apiKey'] ?? '')),
                'baseUrl' => rtrim(trim((string)($input['ai']['doubao']['baseUrl'] ?? $current['ai']['doubao']['baseUrl'] ?? 'https://ark.cn-beijing.volces.com/api/v3')), '/'),
                'model' => trim((string)($input['ai']['doubao']['model'] ?? $current['ai']['doubao']['model'] ?? 'doubao-seed-1-6-250615')),
            ],
            'openaiCompatible' => [
                'apiKey' => trim((string)($input['ai']['openaiCompatible']['apiKey'] ?? $current['ai']['openaiCompatible']['apiKey'] ?? '')),
                'baseUrl' => rtrim(trim((string)($input['ai']['openaiCompatible']['baseUrl'] ?? $current['ai']['openaiCompatible']['baseUrl'] ?? '')), '/'),
                'model' => trim((string)($input['ai']['openaiCompatible']['model'] ?? $current['ai']['openaiCompatible']['model'] ?? '')),
            ],
        ],
        'dify' => [
            'enabled' => !empty($input['dify']['enabled']),
            'baseUrl' => rtrim(trim((string)($input['dify']['baseUrl'] ?? $current['dify']['baseUrl'] ?? '')), '/'),
            'taskWorkflowApiKey' => trim((string)($input['dify']['taskWorkflowApiKey'] ?? $current['dify']['taskWorkflowApiKey'] ?? '')),
            'tripWorkflowApiKey' => trim((string)($input['dify']['tripWorkflowApiKey'] ?? $current['dify']['tripWorkflowApiKey'] ?? '')),
            'recommendWorkflowApiKey' => trim((string)($input['dify']['recommendWorkflowApiKey'] ?? $current['dify']['recommendWorkflowApiKey'] ?? '')),
            'preferenceWorkflowApiKey' => trim((string)($input['dify']['preferenceWorkflowApiKey'] ?? $current['dify']['preferenceWorkflowApiKey'] ?? '')),
            'detailWorkflowApiKey' => trim((string)($input['dify']['detailWorkflowApiKey'] ?? $current['dify']['detailWorkflowApiKey'] ?? '')),
            'chatflowApiKey' => trim((string)($input['dify']['chatflowApiKey'] ?? $current['dify']['chatflowApiKey'] ?? '')),
            'timeout' => max(5, min(300, (int)($input['dify']['timeout'] ?? $current['dify']['timeout'] ?? 90))),
        ],
    ]);
    $next = shiguang_normalize_settings($next);

    $pdo = shiguang_pdo();
    if ($pdo instanceof PDO) {
        $stmt = $pdo->prepare(
            'INSERT INTO app_settings (setting_key, setting_value) VALUES (:key, :value)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
        );
        $stmt->execute([
            'key' => 'integrations',
            'value' => json_encode($next, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
        return $next;
    }

    shiguang_write_json_file(shiguang_settings_path(), $next);
    return $next;
}

/**
 * 单用户模式 — 返回唯一的本地用户标识。
 */
function shiguang_single_user(): array
{
    return [
        'id' => 'single-user',
        'name' => '旅行者',
        'email' => 'traveler@shiguang.local',
        'role' => 'user',
        'status' => 'active',
        'profile' => [
            'persona' => '慢热人文探索者',
            'budgetLevel' => '均衡偏省',
            'travelPace' => '慢游',
            'avoidances' => '高强度排队、重复古镇、强购物团',
        ],
    ];
}

function shiguang_preference_path(): string
{
    return shiguang_storage_dir() . '/preference_vectors.json';
}

function shiguang_preference_lexicon(): array
{
    return [
        'like' => ['喜欢', '偏爱', '想去', '舒服', '松弛', '好看', '摄影', '人文', '自然', '美食', '海风', '古建', '小众', '慢游', '咖啡', '博物馆'],
        'avoid' => ['不喜欢', '避开', '讨厌', '排队', '商业区', '购物团', '重复', '拥挤', '踩坑', '太贵', '太赶', '高强度'],
        'budget' => ['预算', '省钱', '性价比', '均衡', '舒适', '奢华', '花费', '便宜', '贵'],
        'pace' => ['节奏', '慢', '紧凑', '特种兵', '深度', '轻松', '休息', '留白'],
        'food' => ['吃', '餐厅', '小吃', '夜市', '咖啡', '本地小店', '忌口', '海鲜'],
        'lodging' => ['住宿', '酒店', '民宿', '景观', '交通方便', '高品质'],
        'transport' => ['交通', '自驾', '公交', '地铁', '打车', '步行', '骑行'],
    ];
}

function shiguang_detect_preference_type(string $text): string
{
    $scores = [];
    foreach (shiguang_preference_lexicon() as $type => $words) {
        $scores[$type] = 0;
        foreach ($words as $word) {
            if (str_contains($text, $word)) {
                $scores[$type]++;
            }
        }
    }
    arsort($scores);
    $type = (string)array_key_first($scores);
    return ($scores[$type] ?? 0) > 0 ? $type : 'general';
}

function shiguang_extract_tags(string $text): array
{
    $tags = [];
    foreach (shiguang_preference_lexicon() as $words) {
        foreach ($words as $word) {
            if (str_contains($text, $word)) {
                $tags[] = $word;
            }
        }
    }
    return array_values(array_unique(array_slice($tags, 0, 12)));
}

function shiguang_vectorize(string $text): array
{
    $text = strtolower($text);
    $weights = [];
    foreach (shiguang_preference_lexicon() as $type => $words) {
        foreach ($words as $word) {
            if (str_contains($text, $word)) {
                $weights[$type . ':' . $word] = ($weights[$type . ':' . $word] ?? 0) + 2.2;
                $weights['type:' . $type] = ($weights['type:' . $type] ?? 0) + 1.4;
            }
        }
    }
    preg_match_all('/[a-z0-9]+|[\x{4e00}-\x{9fff}]/u', $text, $matches);
    foreach ($matches[0] ?? [] as $token) {
        $weights['tok:' . $token] = ($weights['tok:' . $token] ?? 0) + 0.35;
    }
    $norm = sqrt(array_sum(array_map(static fn (float $value): float => $value * $value, $weights)));
    if ($norm <= 0) {
        return [];
    }
    foreach ($weights as $key => $value) {
        $weights[$key] = round($value / $norm, 6);
    }
    arsort($weights);
    return array_slice($weights, 0, 80, true);
}

function shiguang_vector_similarity(array $left, array $right): float
{
    $score = 0.0;
    foreach ($left as $key => $value) {
        if (isset($right[$key])) {
            $score += (float)$value * (float)$right[$key];
        }
    }
    return round($score, 6);
}

function shiguang_preference_reports_path(): string
{
    return shiguang_storage_dir() . '/preference_reports.json';
}

function shiguang_preference_report_cache(): array
{
    return shiguang_read_json_file(shiguang_preference_reports_path(), ['meta' => [], 'users' => []]);
}

function shiguang_save_preference_report_cache(array $cache): void
{
    shiguang_write_json_file(shiguang_preference_reports_path(), $cache);
}

function shiguang_preference_report_date(): string
{
    return date('Y-m-d');
}

function shiguang_should_run_daily_preference_reports(array $cache): bool
{
    return (int)date('G') >= 1 && (string)($cache['meta']['lastDailyRun'] ?? '') !== shiguang_preference_report_date();
}

function shiguang_build_preference_report(string $userId, array $destinations, string $trigger = 'manual'): array
{
    $preferences = shiguang_preferences($userId);
    $activePreferences = array_values(array_filter($preferences, static fn (array $item): bool => ($item['status'] ?? 'pending') !== 'ignored'));
    $confirmed = array_values(array_filter($activePreferences, static fn (array $item): bool => ($item['status'] ?? 'pending') === 'confirmed'));
    $pending = array_values(array_filter($activePreferences, static fn (array $item): bool => ($item['status'] ?? 'pending') === 'pending'));
    $profileText = implode(' ', array_map(static fn (array $item): string => trim((string)($item['title'] ?? '') . ' ' . (string)($item['detail'] ?? '') . ' ' . implode(' ', $item['tags'] ?? [])), $activePreferences));
    $profileVector = shiguang_vectorize($profileText ?: '慢游 城市 风景 预算 人文');

    $recommendations = array_map(static function (array $destination, int $index) use ($profileVector, $activePreferences): array {
        $text = $destination['name'] . ' ' . $destination['intro'] . ' ' . $destination['summary'] . ' ' . implode(' ', $destination['tags']);
        $destinationVector = shiguang_vectorize($text);
        $bestLike = 0.0;
        $bestAvoid = 0.0;
        foreach ($activePreferences as $preference) {
            $similarity = shiguang_vector_similarity($destinationVector, $preference['vector'] ?? []) * (float)($preference['weight'] ?? 0.7);
            if (($preference['type'] ?? '') === 'avoid') {
                $bestAvoid = max($bestAvoid, $similarity);
            } else {
                $bestLike = max($bestLike, $similarity);
            }
        }
        $profileMatch = shiguang_vector_similarity($profileVector, $destinationVector);
        $score = max(40, min(99, round((float)($destination['weight'] ?? 80) + ($profileMatch * 24) + ($bestLike * 18) - ($bestAvoid * 24) - ($index * 2))));
        return [
            'id' => 'rec-' . ($destination['id'] ?? $index),
            'score' => $score,
            'reason' => $destination['name'] . ' 重新按你的偏好数据库排序，匹配当前画像中的高权重信号。',
            'difference' => $bestAvoid > 0.2 ? '已降低与你避开项相近的部分，把主体验转向更稳定、不重复的玩法。' : '保留熟悉的松弛感，但主体体验不重复。',
            'avoidReason' => '避开旺季核心区，把主行程放在清晨或傍晚。',
            'memoryMatch' => ['like' => round($bestLike, 3), 'avoid' => round($bestAvoid, 3), 'profile' => round($profileMatch, 3)],
            'destination' => $destination,
        ];
    }, $destinations, array_keys($destinations));

    usort($recommendations, static fn (array $a, array $b): int => ($b['score'] <=> $a['score']));
    $topSignals = array_values(array_unique(array_filter(array_merge(
        array_map(static fn (array $item): string => (string)($item['title'] ?? ''), array_slice($confirmed, 0, 4)),
        array_map(static fn (array $item): string => (string)($item['title'] ?? ''), array_slice($pending, 0, 3))
    ))));

    return [
        'userId' => $userId,
        'title' => '每日偏好报告',
        'summary' => $topSignals ? '今日推荐主要参考：' . implode('、', array_slice($topSignals, 0, 4)) : '今日推荐使用默认慢游、人文和预算均衡画像。',
        'confirmedCount' => count($confirmed),
        'pendingCount' => count($pending),
        'ignoredCount' => count($preferences) - count($activePreferences),
        'topSignals' => $topSignals,
        'recommendations' => array_slice($recommendations, 0, 6),
        'generatedAt' => date(DATE_ATOM),
        'generatedDate' => shiguang_preference_report_date(),
        'trigger' => $trigger,
    ];
}

function shiguang_preference_report(string $userId, array $destinations, bool $force = false, string $trigger = 'manual'): array
{
    $cache = shiguang_preference_report_cache();
    $existing = $cache['users'][$userId] ?? null;
    if (!$force && is_array($existing)) {
        return $existing;
    }
    $report = shiguang_build_preference_report($userId, $destinations, $trigger);
    $cache['users'][$userId] = $report;
    shiguang_save_preference_report_cache($cache);
    return $report;
}

function shiguang_run_due_preference_reports(array $destinations): void
{
    $cache = shiguang_preference_report_cache();
    if (!shiguang_should_run_daily_preference_reports($cache)) {
        return;
    }
    foreach ([shiguang_single_user()] as $user) {
        $userId = (string)($user['id'] ?? '');
        if ($userId !== '') {
            $cache['users'][$userId] = shiguang_build_preference_report($userId, $destinations, 'daily-1am');
        }
    }
    $cache['meta']['lastDailyRun'] = shiguang_preference_report_date();
    $cache['meta']['lastDailyRunAt'] = date(DATE_ATOM);
    shiguang_save_preference_report_cache($cache);
}

function shiguang_seed_preferences(): array
{
    return [];
}

function shiguang_preference_user_id(?string $userId = null): string
{
    if ($userId !== null && trim($userId) !== '') {
        return trim($userId);
    }
    $user = shiguang_single_user();
    return (string)($user['id'] ?? 'single-user');
}

function shiguang_all_preferences(): array
{
    $pdo = shiguang_pdo();
    if ($pdo instanceof PDO) {
        $rows = $pdo->query('SELECT * FROM preference_vectors ORDER BY updated_at DESC')->fetchAll();
        if ($rows) {
            return array_map(static fn (array $row): array => [
                'id' => $row['id'],
                'userId' => $row['user_id'],
                'type' => $row['type'],
                'title' => $row['title'],
                'detail' => $row['detail'],
                'source' => $row['source'],
                'status' => $row['status'],
                'confidence' => (float)$row['confidence'],
                'weight' => (float)$row['weight'],
                'tags' => shiguang_db_json_decode($row['tags_json'] ?? '[]'),
                'vector' => shiguang_db_json_decode($row['vector_json'] ?? '{}'),
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at'],
            ], $rows);
        }
    }

    $saved = shiguang_read_json_file(shiguang_preference_path());
    return $saved ?: shiguang_seed_preferences();
}

function shiguang_preferences(?string $userId = null): array
{
    $targetUserId = shiguang_preference_user_id($userId);
    $items = array_values(array_filter(shiguang_all_preferences(), static function (array $preference) use ($targetUserId): bool {
        return (string)($preference['userId'] ?? 'demo') === $targetUserId && shiguang_valid_preference_entry($preference);
    }));
    $seen = [];
    return array_values(array_filter($items, static function (array $preference) use (&$seen): bool {
        $key = mb_strtolower((string)($preference['type'] ?? 'general') . '|' . trim((string)($preference['title'] ?? '')) . '|' . trim((string)($preference['detail'] ?? '')));
        if (isset($seen[$key])) {
            return false;
        }
        $seen[$key] = true;
        return true;
    }));
}

function shiguang_save_preferences(array $preferences): void
{
    $pdo = shiguang_pdo();
    if ($pdo instanceof PDO) {
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO preference_vectors
                 (id, user_id, type, title, detail, source, status, confidence, weight, tags_json, vector_json, created_at, updated_at)
                 VALUES
                 (:id, :user_id, :type, :title, :detail, :source, :status, :confidence, :weight, :tags_json, :vector_json, :created_at, :updated_at)
                 ON DUPLICATE KEY UPDATE
                 user_id = VALUES(user_id),
                 type = VALUES(type),
                 title = VALUES(title),
                 detail = VALUES(detail),
                 source = VALUES(source),
                 status = VALUES(status),
                 confidence = VALUES(confidence),
                 weight = VALUES(weight),
                 tags_json = VALUES(tags_json),
                 vector_json = VALUES(vector_json),
                 updated_at = VALUES(updated_at)'
            );
            foreach ($preferences as $preference) {
                $stmt->execute([
                    'id' => $preference['id'],
                    'user_id' => $preference['userId'] ?? 'demo',
                    'type' => $preference['type'],
                    'title' => $preference['title'],
                    'detail' => $preference['detail'],
                    'source' => $preference['source'] ?? 'manual',
                    'status' => $preference['status'] ?? 'pending',
                    'confidence' => $preference['confidence'] ?? 0.7,
                    'weight' => $preference['weight'] ?? 0.72,
                    'tags_json' => json_encode($preference['tags'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'vector_json' => json_encode($preference['vector'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'created_at' => date('Y-m-d H:i:s', strtotime((string)($preference['createdAt'] ?? 'now'))),
                    'updated_at' => date('Y-m-d H:i:s', strtotime((string)($preference['updatedAt'] ?? 'now'))),
                ]);
            }
            $pdo->commit();
        } catch (Throwable $error) {
            $pdo->rollBack();
            throw $error;
        }
        return;
    }
    shiguang_write_json_file(shiguang_preference_path(), array_values($preferences));
}

function shiguang_invalid_preference_text(string $text): bool
{
    $text = trim($text);
    if ($text === '') {
        return true;
    }
    if (preg_match('/^[a-z0-9\s?.!,，。！？、-]{1,2}$/iu', $text)) {
        return true;
    }
    if (preg_match('/\?{3,}|�|鎴|鏄|妭|閬|垮|瘨|鍘|诲|摢|鍐|宀|瀬|鑸|掗|€/u', $text)) {
        return true;
    }
    return false;
}

function shiguang_valid_preference_entry(array $preference): bool
{
    $title = trim((string)($preference['title'] ?? ''));
    $detail = trim((string)($preference['detail'] ?? ''));
    if (shiguang_invalid_preference_text($title) || shiguang_invalid_preference_text($detail)) {
        return false;
    }
    $tags = $preference['tags'] ?? [];
    if (
        (string)($preference['source'] ?? '') === 'chat'
        && (string)($preference['type'] ?? 'general') === 'general'
        && is_array($tags)
        && count($tags) === 0
        && $title === $detail
        && preg_match('/[?？]$/u', $title)
    ) {
        return false;
    }
    return true;
}

function shiguang_upsert_preference(array $input): array
{
    $preferences = shiguang_all_preferences();
    $detail = trim((string)($input['detail'] ?? $input['text'] ?? ''));
    $title = trim((string)($input['title'] ?? ''));
    if ($detail === '') {
        $detail = '用户表达了新的旅行偏好。';
    }
    if ($title === '') {
        preg_match('/^.{1,18}/us', $detail, $match);
        $prefix = $match[0] ?? substr($detail, 0, 54);
        $title = $prefix . ($prefix !== $detail ? '...' : '');
    }
    if (shiguang_invalid_preference_text($title) || shiguang_invalid_preference_text($detail)) {
        throw new InvalidArgumentException('偏好内容太短、乱码或不可识别。');
    }
    $type = trim((string)($input['type'] ?? '')) ?: shiguang_detect_preference_type($title . ' ' . $detail);
    $text = $title . ' ' . $detail;
    $vector = shiguang_vectorize($text);
    $now = date(DATE_ATOM);
    $entry = [
        'id' => (string)($input['id'] ?? ('mem_' . substr(md5($text . $now), 0, 12))),
        'userId' => shiguang_preference_user_id(isset($input['userId']) ? (string)$input['userId'] : null),
        'type' => $type,
        'title' => $title,
        'detail' => $detail,
        'source' => (string)($input['source'] ?? 'manual'),
        'status' => (string)($input['status'] ?? 'pending'),
        'confidence' => min(0.98, max(0.35, (float)($input['confidence'] ?? 0.72))),
        'weight' => (float)($input['weight'] ?? 0.72),
        'tags' => shiguang_extract_tags($text),
        'vector' => $vector,
        'createdAt' => $now,
        'updatedAt' => $now,
    ];
    array_unshift($preferences, $entry);
    shiguang_save_preferences($preferences);
    return $entry;
}

function shiguang_search_preferences(string $query, int $limit = 5): array
{
    $queryVector = shiguang_vectorize($query);
    $results = [];
    foreach (shiguang_preferences() as $preference) {
        $score = shiguang_vector_similarity($queryVector, $preference['vector'] ?? []);
        if ($score > 0) {
            $preference['similarity'] = $score;
            $results[] = $preference;
        }
    }
    usort($results, static fn (array $a, array $b): int => ($b['similarity'] <=> $a['similarity']));
    return array_slice($results, 0, $limit);
}

function shiguang_confirm_preference(string $id, string $status): ?array
{
    $preferences = shiguang_all_preferences();
    $userId = shiguang_preference_user_id();
    foreach ($preferences as $index => $preference) {
        if (($preference['id'] ?? '') === $id && (string)($preference['userId'] ?? 'demo') === $userId) {
            $preferences[$index]['status'] = $status;
            $preferences[$index]['weight'] = $status === 'confirmed' ? 1.0 : 0.55;
            $preferences[$index]['updatedAt'] = date(DATE_ATOM);
            shiguang_save_preferences($preferences);
            return $preferences[$index];
        }
    }
    return null;
}

function shiguang_delete_preference(string $id): bool
{
    $preferences = shiguang_all_preferences();
    $userId = shiguang_preference_user_id();
    $next = array_values(array_filter($preferences, static fn (array $item): bool => !(($item['id'] ?? '') === $id && (string)($item['userId'] ?? 'single-user') === $userId)));
    if (count($next) === count($preferences)) {
        return false;
    }
    $pdo = shiguang_pdo();
    if ($pdo instanceof PDO) {
        $stmt = $pdo->prepare('DELETE FROM preference_vectors WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
    } else {
        shiguang_save_preferences($next);
    }
    return true;
}

function shiguang_http_json(string $method, string $url, array $headers = [], ?array $payload = null, int $timeout = 20): array
{
    $headerLines = array_merge(['Accept: application/json'], $headers);
    $ca = __DIR__ . '/runtime/php/extras/ssl/cacert.pem';
    $body = false;
    $status = 0;
    $error = '';

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_HTTPHEADER => $headerLines,
            CURLOPT_TIMEOUT => $timeout,
        ]);
        if (is_file($ca)) {
            curl_setopt($curl, CURLOPT_CAINFO, $ca);
        }
        if ($payload !== null) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }
        $body = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => strtoupper($method),
                'header' => implode("\r\n", $headerLines),
                'content' => $payload === null ? '' : json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'timeout' => $timeout,
                'ignore_errors' => true,
            ],
            'ssl' => is_file($ca) ? [
                'cafile' => $ca,
                'verify_peer' => true,
                'verify_peer_name' => true,
            ] : [],
        ]);
        $body = @file_get_contents($url, false, $context);
        $statusLine = $http_response_header[0] ?? '';
        if (preg_match('/\s(\d{3})\s/', $statusLine, $match)) {
            $status = (int)$match[1];
        }
        if ($body === false) {
            $error = error_get_last()['message'] ?? '远程接口请求失败。';
        }
    }

    if ($body === false || $error !== '') {
        error_log('[拾光旅图] HTTP 请求失败: ' . ($error ?: '未知错误') . ' | URL: ' . $url);
        throw new RuntimeException($error ?: '远程接口请求失败。');
    }
    $decoded = json_decode((string)$body, true);
    if ($status < 200 || $status >= 300) {
        $message = is_array($decoded) ? json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : (string)$body;
        error_log('[拾光旅图] HTTP 错误状态 ' . $status . ' | URL: ' . $url . ' | ' . mb_substr($message, 0, 120));
        throw new RuntimeException('远程接口返回 HTTP ' . $status . ': ' . mb_substr($message, 0, 240));
    }
    return is_array($decoded) ? $decoded : ['raw' => $body];
}

// ── Dify 集成 ──────────────────────────────────────────────────────────────────

/**
 * 检查 Dify 应用是否已配置可用。
 * @param string $app 'task' | 'chat'
 */
function shiguang_dify_configured(string $app = 'task'): bool
{
    $dify = shiguang_settings()['dify'] ?? [];
    if (empty($dify['enabled']) || empty($dify['baseUrl'])) {
        return false;
    }
    if ($app === 'task') {
        // v1 任务路由 Key 或 v2 任意专用 Key 均可
        if (!empty($dify['taskWorkflowApiKey'])) return true;
        if (!empty($dify['tripWorkflowApiKey'])) return true;
        if (!empty($dify['recommendWorkflowApiKey'])) return true;
        if (!empty($dify['preferenceWorkflowApiKey'])) return true;
        if (!empty($dify['detailWorkflowApiKey'])) return true;
        return false;
    }
    if ($app === 'chat' && !empty($dify['chatflowApiKey'])) {
        return true;
    }
    return false;
}

/**
 * 调用 Dify Workflow（阻塞模式）。
 * @param string $workflowType '' 则使用 taskWorkflowApiKey，否则用对应类型专用 Key（trip/recommend/preference/detail）
 * 返回 Dify 响应数组。
 */
function shiguang_dify_run_workflow(array $inputs, string $userId, string $workflowType = ''): array
{
    $settings = shiguang_settings()['dify'] ?? [];
    $enabled = !empty($settings['enabled']);
    $baseUrl = rtrim(trim((string)($settings['baseUrl'] ?? '')), '/');
    $apiKey = $workflowType !== '' ? shiguang_dify_api_key_for($workflowType) : trim((string)($settings['taskWorkflowApiKey'] ?? ''));
    $timeout = max(5, min(300, (int)($settings['timeout'] ?? 90)));

    if (!$enabled || $baseUrl === '' || $apiKey === '') {
        throw new RuntimeException('Dify 工作流未启用或配置不完整。');
    }

    return shiguang_http_json(
        'POST',
        $baseUrl . '/workflows/run',
        [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        [
            'inputs' => $inputs,
            'response_mode' => 'blocking',
            'user' => $userId !== '' ? $userId : 'guest',
        ],
        $timeout
    );
}

/**
 * 从 Dify Workflow 响应中提取并校验任务结果。
 * 返回解析后的 result_json 数组。
 */
function shiguang_dify_extract_task_result(array $response, string $expectedTaskType): array
{
    $data = $response['data'] ?? null;
    if (!is_array($data)) {
        throw new RuntimeException('Dify 响应缺少 data 字段。');
    }

    $status = (string)($data['status'] ?? '');
    if ($status !== 'succeeded' && $status !== '') {
        $error = (string)($data['error'] ?? $data['message'] ?? '未知错误');
        throw new RuntimeException('Dify 工作流未成功完成: ' . mb_substr($error, 0, 200));
    }

    $outputs = $data['outputs'] ?? null;
    if (!is_array($outputs)) {
        throw new RuntimeException('Dify 响应缺少 outputs。');
    }

    // 优先从 result_json 提取
    $resultJson = (string)($outputs['result_json'] ?? '');
    if ($resultJson !== '') {
        $decoded = json_decode($resultJson, true);
        if (is_array($decoded)) {
            return $decoded;
        }
        throw new RuntimeException('Dify result_json 无法解析为 JSON 对象。');
    }

    // 回退：从 outputs 中提取 text 字段
    $text = (string)($outputs['text'] ?? '');
    if ($text !== '') {
        $decoded = json_decode($text, true);
        if (is_array($decoded)) {
            return $decoded;
        }
        // 纯文本输出，包装为结果
        return ['text' => $text, 'task_type' => (string)($outputs['task_type'] ?? $expectedTaskType)];
    }

    // 最后回退：直接返回 outputs（去掉元数据）
    $result = $outputs;
    unset($result['task_type'], $result['schema_version'], $result['result_json']);
    if (!empty($result)) {
        return $result;
    }

    throw new RuntimeException('Dify outputs 无可提取的结果数据。');
}

/**
 * 调用 Dify Chatflow（阻塞模式）。
 * 返回完整响应数组，包含 answer 和 conversation_id。
 */
function shiguang_dify_chat_blocking(array $payload): array
{
    $settings = shiguang_settings()['dify'] ?? [];
    $enabled = !empty($settings['enabled']);
    $baseUrl = rtrim(trim((string)($settings['baseUrl'] ?? '')), '/');
    $apiKey = trim((string)($settings['chatflowApiKey'] ?? ''));
    $timeout = max(5, min(300, (int)($settings['timeout'] ?? 90)));

    if (!$enabled || $baseUrl === '' || $apiKey === '') {
        throw new RuntimeException('Dify Chatflow 未启用或配置不完整。');
    }

    $body = array_merge($payload, ['response_mode' => 'blocking']);

    return shiguang_http_json(
        'POST',
        $baseUrl . '/chat-messages',
        [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        $body,
        $timeout
    );
}

/**
 * 去除模型回答中的 </think>…</think> 思维链标签及其内容，
 * 以及 Dify 工作流模板泄漏的 {% … %} 语法标签。
 */
function shiguang_dify_strip_thinking(string $text): string
{
    $text = preg_replace('/<think>.*?<\/think>/is', '', $text);
    $text = preg_replace('/<\/?think>/i', '', $text);
    $text = preg_replace('/{%\s*(?:endif|endfor|endblock|if|else|for|block)\s*%}/i', '', $text);
    $text = preg_replace('/\{\{.*?\}\}/', '', $text);
    $text = preg_replace('/\{%.*?%\}/s', '', $text);
    return trim($text);
}

function shiguang_preference_prompt_context(?string $userId = null, int $limit = 8): string
{
    $preferences = array_values(array_filter(shiguang_preferences($userId), static function (array $preference): bool {
        return in_array((string)($preference['status'] ?? 'pending'), ['confirmed', 'pending'], true);
    }));
    if (!$preferences) {
        return '当前用户暂无已记录偏好。';
    }
    usort($preferences, static fn (array $a, array $b): int => ((float)($b['weight'] ?? 0) <=> (float)($a['weight'] ?? 0)));
    $lines = array_map(static function (array $preference): string {
        $status = (string)($preference['status'] ?? 'pending');
        $type = (string)($preference['type'] ?? 'general');
        $title = trim((string)($preference['title'] ?? '未命名偏好'));
        $detail = trim((string)($preference['detail'] ?? ''));
        return '- [' . $status . '/' . $type . '] ' . $title . ($detail !== '' ? '：' . $detail : '');
    }, array_slice($preferences, 0, max(1, $limit)));

    return implode("\n", $lines);
}

function shiguang_ai_reply(string $message, ?string $provider = null, string $conversationId = '', string $currentRoute = 'advisor'): array
{
    $currentUser = shiguang_single_user();
    $userId = trim((string)($currentUser['id'] ?? 'guest')) ?: 'single-user';
    $preferenceContext = shiguang_preference_prompt_context();

    // ── 一级路径：Dify Chatflow ─────────────────────────────────────────
    if (shiguang_dify_configured('chat')) {
        try {
            $payload = [
                'inputs' => $conversationId === '' ? [
                    'user_id' => $userId,
                    'current_route' => $currentRoute,
                ] : new stdClass(), // 继续会话时 inputs 为空对象
                'query' => $message,
                'conversation_id' => $conversationId,
                'user' => $userId,
            ];
            $response = shiguang_dify_chat_blocking($payload);
            $answer = (string)($response['answer'] ?? '');
            $answer = shiguang_dify_strip_thinking($answer);
            if ($answer === '') {
                throw new RuntimeException('Dify Chatflow 返回为空。');
            }
            return [
                'content' => $answer,
                'provider' => 'dify-chatflow',
                'fallback' => false,
                'conversationId' => (string)($response['conversation_id'] ?? ''),
            ];
        } catch (Throwable $error) {
            // Dify 不可用，返回具体错误信息
            $errorMsg = $error->getMessage();
            error_log('[拾光旅图] Dify Chatflow 调用失败: ' . $errorMsg);
            return [
                'content' => '⚠️ AI 顾问暂时无法连接：' . $errorMsg . '。请检查 Dify 服务地址和 API Key 是否正确。',
                'provider' => 'local-fallback',
                'fallback' => true,
                'fallbackReason' => $errorMsg,
                'conversationId' => $conversationId,
            ];
        }
    }

    // Dify 未配置时的兜底
    return [
        'content' => 'Dify 工作流引擎未配置。请在设置页配置 Dify 服务器地址和 API Key，即可使用 AI 旅行顾问。',
        'provider' => 'unconfigured',
        'fallback' => true,
        'conversationId' => $conversationId,
    ];
}

function shiguang_extract_json_object(string $content): ?array
{
    $content = trim($content);
    if ($content === '') {
        return null;
    }

    if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/is', $content, $match)) {
        $decoded = json_decode($match[1], true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }

    $start = strpos($content, '{');
    $end = strrpos($content, '}');
    if ($start === false || $end === false || $end <= $start) {
        return null;
    }

    $json = substr($content, $start, $end - $start + 1);
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : null;
}

function shiguang_destination_details_path(): string
{
    return shiguang_storage_dir() . '/destination_details.json';
}

function shiguang_destination_detail_cache(): array
{
    return shiguang_read_json_file(shiguang_destination_details_path());
}

function shiguang_save_destination_detail_cache(array $items): void
{
    shiguang_write_json_file(shiguang_destination_details_path(), $items);
}

function shiguang_local_destination_detail(array $destination, string $error = ''): array
{
    $name = (string)($destination['name'] ?? '目的地');
    return [
        'id' => (string)($destination['id'] ?? md5($name)),
        'name' => $name,
        'summary' => (string)($destination['summary'] ?? $name . ' 的详细信息待 Dify 工作流生成。'),
        'suitableFor' => 'Dify 工作流当前不可用，请检查配置后重新获取。',
        'difference' => 'Dify 工作流当前不可用。',
        'highlight' => 'Dify 工作流当前不可用。',
        'warning' => 'Dify 工作流当前不可用。',
        'play' => 'Dify 工作流当前不可用。',
        'geography' => [
            ['title' => '地理信息', 'body' => 'Dify 工作流当前不可用，请稍后重试。'],
        ],
        'route' => [
            ['title' => '路线参考', 'morning' => '待生成', 'afternoon' => '待生成', 'evening' => '待生成', 'notes' => 'Dify 工作流不可用'],
        ],
        'budget' => [
            ['title' => '预算参考', 'amount' => 0, 'note' => 'Dify 工作流不可用'],
        ],
        'pitfalls' => [
            ['title' => '注意事项', 'body' => 'Dify 工作流当前不可用。'],
        ],
        'similarButDifferent' => [
            ['title' => '参考', 'body' => 'Dify 工作流当前不可用。'],
        ],
        'provider' => 'local-fallback',
        'fallback' => true,
        'raw' => $error,
        'cachedAt' => date(DATE_ATOM),
    ];
}

function shiguang_normalize_destination_detail(array $detail, array $destination, string $provider, string $raw): array
{
    $fallback = shiguang_local_destination_detail($destination);
    $list = static function ($value, array $fallbackItems): array {
        if (!is_array($value)) {
            return $fallbackItems;
        }
        return array_values(array_filter(array_map(static fn ($item) => is_array($item) ? $item : [], $value))) ?: $fallbackItems;
    };
    return [
        'id' => (string)($destination['id'] ?? ($detail['id'] ?? '')),
        'name' => trim((string)($detail['name'] ?? $destination['name'] ?? $fallback['name'])),
        'summary' => trim((string)($detail['summary'] ?? $fallback['summary'])),
        'suitableFor' => trim((string)($detail['suitableFor'] ?? $fallback['suitableFor'])),
        'difference' => trim((string)($detail['difference'] ?? $fallback['difference'])),
        'highlight' => trim((string)($detail['highlight'] ?? $fallback['highlight'])),
        'warning' => trim((string)($detail['warning'] ?? $fallback['warning'])),
        'play' => trim((string)($detail['play'] ?? $fallback['play'])),
        'geography' => $list($detail['geography'] ?? null, $fallback['geography']),
        'route' => $list($detail['route'] ?? null, $fallback['route']),
        'budget' => $list($detail['budget'] ?? null, $fallback['budget']),
        'pitfalls' => $list($detail['pitfalls'] ?? null, $fallback['pitfalls']),
        'similarButDifferent' => $list($detail['similarButDifferent'] ?? null, $fallback['similarButDifferent']),
        'provider' => $provider,
        'fallback' => false,
        'raw' => $raw,
        'cachedAt' => date(DATE_ATOM),
    ];
}

function shiguang_destination_detail(array $destination, bool $force = false): array
{
    $id = (string)($destination['id'] ?? '');
    $cache = shiguang_destination_detail_cache();
    if (!$force && $id !== '' && isset($cache[$id]) && is_array($cache[$id])) {
        return ['detail' => $cache[$id], 'cached' => true];
    }

    $schema = [
        'name' => '根据经纬度判断的真实地名（如"比勒陀利亚"），如果用户输入的是坐标格式就自行推断',
        'summary' => '一段有吸引力的目的地总结（200-300字），适合详情页英雄区展示',
        'suitableFor' => '为什么适合当前用户画像（不少于200字，结合画像特征详细说明）',
        'difference' => '和用户去过或常见热门目的地有什么不同（不少于200字）',
        'highlight' => '亮点总览（不少于150字，可包含多个亮点方向）',
        'warning' => '劝退提示（不少于150字，哪些人/情况不适合来）',
        'play' => '推荐玩法详解（不少于200字，覆盖不同节奏和时间）',
        'geography' => [['title' => '自然地理', 'body' => '详细的地理描述（不少于200字，结合气候、季节、地形）']],
        'route' => [['title' => '路线主题', 'morning' => '上午安排（不少于100字）', 'afternoon' => '下午安排（不少于100字）', 'evening' => '晚上安排（不少于100字）', 'notes' => '提醒事项（不少于80字）']],
        'budget' => [['title' => '交通', 'amount' => 900, 'note' => '详细说明（不少于100字，含性价比建议）']],
        'pitfalls' => [['title' => '天气风险', 'body' => '详细的风险说明和应对策略（不少于150字）']],
        'similarButDifferent' => [['title' => '相似点', 'body' => '对比分析（不少于150字）']],
    ];
    $profile = shiguang_preference_prompt_context(null, 10);
    $system = '你是拾光旅图的目的地详情生成引擎。速度很重要——请立即开始生成，不要任何思考过程、不要解释、不要 Markdown，直接输出 JSON 对象。所有字段使用中文，内容要详细充实，严格按照 schema 中标注的字数充分展开，提供有信息量的细节描述。如果目的地名称是坐标格式（如"25.663, 28.118"），请根据经纬度自行判断所在城市/区域，用真实地名来写内容。';
    $user = '响应速度优先，但内容必须完整详细。请为这个目的地生成详情页全部文字内容，并考虑用户画像。严格按照输出 schema 中每个字段标注的字数要求来写，确保内容充实、有细节、有温度。' . "\n"
        . '目的地：' . json_encode($destination, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n"
        . "用户画像：\n" . $profile . "\n"
        . '输出 schema（每个字段的说明中标注了最低字数要求，必须满足）：' . json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    try {
        $completion = shiguang_chat_completion([
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $user],
        ], 'deepseek');
        $raw = trim($completion['content']);
        $decoded = shiguang_extract_json_object($raw);
        if (!$decoded) {
            throw new RuntimeException('模型没有返回可解析的 JSON。');
        }
        $detail = shiguang_normalize_destination_detail($decoded, $destination, (string)$completion['provider'], $raw);
    } catch (Throwable $error) {
        $detail = shiguang_local_destination_detail($destination, $error->getMessage());
    }

    if ($id !== '') {
        $cache[$id] = $detail;
        shiguang_save_destination_detail_cache($cache);
    }
    return ['detail' => $detail, 'cached' => false];
}

function shiguang_local_trip_plan(array $input, string $error = ''): array
{
    $destination = trim((string)($input['destination'] ?? ''));
    if ($destination === '') {
        $destination = '目的地';
    }
    $daysCount = max(1, min(14, (int)($input['days'] ?? 5)));
    $budget = trim((string)($input['budget'] ?? '均衡')) ?: '均衡';
    $pace = trim((string)($input['pace'] ?? '慢游')) ?: '慢游';
    $tags = array_values(array_filter(array_map('strval', $input['tags'] ?? [])));
    $theme = $tags ? implode('、', array_slice($tags, 0, 4)) : '自由探索';

    $days = [];
    for ($i = 1; $i <= $daysCount; $i++) {
        $days[] = [
            'title' => '第 ' . $i . ' 天',
            'morning' => '待 Dify 工作流生成',
            'afternoon' => '待 Dify 工作流生成',
            'evening' => '待 Dify 工作流生成',
            'notes' => 'Dify 服务暂时不可用，请稍后重试。',
        ];
    }

    return [
        'title' => $destination . ' ' . $daysCount . ' 日行程（待生成）',
        'destination' => $destination,
        'daysCount' => $daysCount,
        'budget' => $budget,
        'pace' => $pace,
        'estimate' => 0,
        'overview' => 'Dify 工作流当前不可用，请检查配置后重新生成。',
        'days' => $days,
        'provider' => 'local-fallback',
        'fallback' => true,
        'raw' => $error,
    ];
}

function shiguang_normalize_trip_plan(array $plan, array $input, string $provider, string $raw): array
{
    $fallback = shiguang_local_trip_plan($input);
    $daysCount = max(1, min(14, (int)($input['days'] ?? ($plan['daysCount'] ?? count($plan['days'] ?? [])))));
    $days = [];
    foreach (array_slice(is_array($plan['days'] ?? null) ? $plan['days'] : [], 0, $daysCount) as $index => $day) {
        if (is_string($day)) {
            $day = ['title' => $day];
        }
        if (!is_array($day)) {
            $day = [];
        }
        $fallbackDay = $fallback['days'][$index] ?? [];
        $days[] = [
            'title' => trim((string)($day['title'] ?? $fallbackDay['title'] ?? ('第 ' . ($index + 1) . ' 天'))),
            'morning' => trim((string)($day['morning'] ?? $day['am'] ?? $fallbackDay['morning'] ?? '慢早餐，进入当天主区域')),
            'afternoon' => trim((string)($day['afternoon'] ?? $day['pm'] ?? $fallbackDay['afternoon'] ?? '核心体验 + 备选点')),
            'evening' => trim((string)($day['evening'] ?? $day['night'] ?? $fallbackDay['evening'] ?? '本地餐厅 + 夜间散步')),
            'notes' => trim((string)($day['notes'] ?? $fallbackDay['notes'] ?? '')),
        ];
    }

    while (count($days) < $daysCount) {
        $days[] = $fallback['days'][count($days)];
    }

    return [
        'title' => trim((string)($plan['title'] ?? $fallback['title'])),
        'destination' => trim((string)($plan['destination'] ?? $input['destination'] ?? $fallback['destination'])),
        'daysCount' => $daysCount,
        'budget' => trim((string)($plan['budget'] ?? $input['budget'] ?? $fallback['budget'])),
        'pace' => trim((string)($plan['pace'] ?? $input['pace'] ?? $fallback['pace'])),
        'estimate' => max(0, (int)($plan['estimate'] ?? $fallback['estimate'])),
        'overview' => trim((string)($plan['overview'] ?? $fallback['overview'])),
        'highlights' => array_values(array_filter(array_map('strval', $plan['highlights'] ?? []))),
        'packingTips' => array_values(array_filter(array_map('strval', $plan['packingTips'] ?? []))),
        'days' => $days,
        'provider' => $provider,
        'fallback' => false,
        'raw' => $raw,
    ];
}

function shiguang_generate_trip_plan(array $input, ?string $provider = null): array
{
    $destination = trim((string)($input['destination'] ?? ''));
    $days = max(1, min(14, (int)($input['days'] ?? 5)));
    $budget = trim((string)($input['budget'] ?? '均衡'));
    $pace = trim((string)($input['pace'] ?? '慢游'));
    $tags = array_values(array_filter(array_map('strval', $input['tags'] ?? [])));
    $preferenceContext = shiguang_preference_prompt_context(null, 10);
    $currentUser = shiguang_single_user();
    $userId = trim((string)($currentUser['id'] ?? 'guest')) ?: 'guest';

    $errors = [];

    // ── 一级路径：Dify Workflow ──────────────────────────────────────────
    if (shiguang_dify_configured('task')) {
        try {
            $difyInputs = [
                'destination' => $destination,
                'days' => $days,
                'budget' => $budget,
                'pace' => $pace,
                'tags_json' => json_encode($tags, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'user_id' => $userId,
                'current_date' => date('Y-m-d'),
            ];
            $response = shiguang_dify_run_workflow($difyInputs, $userId, 'trip');
            $plan = shiguang_dify_extract_task_result($response, 'trip_plan');
            $raw = json_encode($response['data']['outputs'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            return shiguang_normalize_trip_plan($plan, $input, 'dify-workflow', $raw ?: '');
        } catch (Throwable $error) {
            $errors[] = 'Dify: ' . $error->getMessage();
        }
    }

    // ── 二级路径：本地规则兜底 ──────────────────────────────────────────
    return shiguang_local_trip_plan($input, implode(' | ', $errors));
}

function shiguang_unsplash_search(string $query, int $perPage = 9): array
{
    $settings = shiguang_settings()['unsplash'] ?? [];
    $accessKey = (string)($settings['accessKey'] ?? '');
    if ($accessKey === '') {
        throw new RuntimeException('Unsplash Access Key 未配置。');
    }
    $url = 'https://api.unsplash.com/search/photos?' . http_build_query([
        'query' => $query,
        'page' => 1,
        'per_page' => max(1, min(30, $perPage)),
        'orientation' => 'landscape',
        'content_filter' => 'high',
    ], '', '&', PHP_QUERY_RFC3986);
    $result = shiguang_http_json('GET', $url, ['Authorization: Client-ID ' . $accessKey], null, 20);
    return array_map(static fn (array $item): array => [
        'id' => $item['id'] ?? '',
        'category' => $item['alt_description'] ?? 'Unsplash 图片',
        'caption' => $item['description'] ?? $item['alt_description'] ?? $query,
        'url' => $item['urls']['regular'] ?? $item['urls']['small'] ?? '',
        'thumb' => $item['urls']['small'] ?? '',
        'author' => $item['user']['name'] ?? '',
        'link' => $item['links']['html'] ?? '',
    ], $result['results'] ?? []);
}

function shiguang_pexels_search(string $query, int $perPage = 9): array
{
    $apiKey = (string)(shiguang_settings()['media']['pexelsApiKey'] ?? '');
    if ($apiKey === '') {
        throw new RuntimeException('Pexels API Key 未配置。');
    }
    $url = 'https://api.pexels.com/v1/search?' . http_build_query([
        'query' => $query,
        'per_page' => max(1, min(30, $perPage)),
        'orientation' => 'landscape',
        'locale' => 'zh-CN',
    ], '', '&', PHP_QUERY_RFC3986);
    $result = shiguang_http_json('GET', $url, ['Authorization: ' . $apiKey], null, 20);
    return array_map(static fn (array $item): array => [
        'id' => 'pexels-' . (string)($item['id'] ?? ''),
        'provider' => 'pexels',
        'category' => $item['alt'] ?? 'Pexels 图片',
        'caption' => $item['alt'] ?? $query,
        'url' => $item['src']['large2x'] ?? $item['src']['large'] ?? $item['src']['medium'] ?? '',
        'thumb' => $item['src']['medium'] ?? '',
        'author' => $item['photographer'] ?? '',
        'link' => $item['url'] ?? '',
    ], $result['photos'] ?? []);
}

function shiguang_pixabay_search(string $query, int $perPage = 9): array
{
    $apiKey = (string)(shiguang_settings()['media']['pixabayApiKey'] ?? '');
    if ($apiKey === '') {
        throw new RuntimeException('Pixabay API Key 未配置。');
    }
    $url = 'https://pixabay.com/api/?' . http_build_query([
        'key' => $apiKey,
        'q' => $query,
        'image_type' => 'photo',
        'orientation' => 'horizontal',
        'safesearch' => 'true',
        'lang' => 'zh',
        'per_page' => max(3, min(30, $perPage)),
    ], '', '&', PHP_QUERY_RFC3986);
    $result = shiguang_http_json('GET', $url, [], null, 20);
    return array_map(static fn (array $item): array => [
        'id' => 'pixabay-' . (string)($item['id'] ?? ''),
        'provider' => 'pixabay',
        'category' => $item['tags'] ?? 'Pixabay 图片',
        'caption' => $item['tags'] ?? $query,
        'url' => $item['largeImageURL'] ?? $item['webformatURL'] ?? '',
        'thumb' => $item['previewURL'] ?? $item['webformatURL'] ?? '',
        'author' => $item['user'] ?? '',
        'link' => $item['pageURL'] ?? '',
    ], $result['hits'] ?? []);
}

function shiguang_apihz_baidu_search(string $query, int $perPage = 9): array
{
    $settings = shiguang_settings()['media'] ?? [];
    $id = (string)($settings['apihzId'] ?? '');
    $key = (string)($settings['apihzKey'] ?? '');
    if ($id === '' || $key === '') {
        throw new RuntimeException('接口盒子开发者 ID 或 Key 未配置。');
    }

    $url = 'https://cn.apihz.cn/api/img/apihzimgbaidu.php?' . http_build_query([
        'id' => $id,
        'key' => $key,
        'words' => $query,
        'limit' => max(1, min(30, $perPage)),
        'page' => 1,
        'type' => 1,
    ], '', '&', PHP_QUERY_RFC3986);

    $result = shiguang_http_json('GET', $url, [], null, 20);

    if (($result['code'] ?? 0) !== 200) {
        throw new RuntimeException('接口盒子错误：' . ($result['msg'] ?? '未知错误'));
    }

    $images = $result['res'] ?? [];
    if (!is_array($images)) {
        return [];
    }

    return array_values(array_slice(array_filter(array_map(static fn (string $imgUrl, int $index): array => [
        'id' => 'apihz-baidu-' . md5($imgUrl),
        'provider' => 'apihz-baidu',
        'category' => $query . ' 图片',
        'caption' => $query,
        'url' => $imgUrl,
        'thumb' => $imgUrl,
        'author' => '百度图片',
        'link' => '',
    ], $images, array_keys($images)), static fn (array $item): bool => !empty($item['url'])), 0, $perPage));
}

function shiguang_apihz_sogou_search(string $query, int $perPage = 9): array
{
    $settings = shiguang_settings()['media'] ?? [];
    $id = (string)($settings['apihzId'] ?? '');
    $key = (string)($settings['apihzKey'] ?? '');
    if ($id === '' || $key === '') {
        throw new RuntimeException('接口盒子开发者 ID 或 Key 未配置。');
    }

    $url = 'https://cn.apihz.cn/api/img/apihzimgsougou.php?' . http_build_query([
        'id' => $id,
        'key' => $key,
        'words' => $query,
        'page' => 1,
        'type' => 1,
    ], '', '&', PHP_QUERY_RFC3986);

    $result = shiguang_http_json('GET', $url, [], null, 20);

    if (($result['code'] ?? 0) !== 200) {
        throw new RuntimeException('接口盒子错误：' . ($result['msg'] ?? '未知错误'));
    }

    $images = $result['res'] ?? [];
    if (!is_array($images)) {
        return [];
    }

    return array_values(array_slice(array_filter(array_map(static fn (string $imgUrl, int $index): array => [
        'id' => 'apihz-sogou-' . md5($imgUrl),
        'provider' => 'apihz-sogou',
        'category' => $query . ' 图片',
        'caption' => $query,
        'url' => $imgUrl,
        'thumb' => $imgUrl,
        'author' => '搜狗图片',
        'link' => '',
    ], $images, array_keys($images)), static fn (array $item): bool => !empty($item['url'])), 0, $perPage));
}

function shiguang_tencent_wimgs_search(string $query, int $perPage = 9): array
{
    $settings = shiguang_settings()['media'] ?? [];
    $secretId = (string)($settings['tencentSecretId'] ?? '');
    $secretKey = (string)($settings['tencentSecretKey'] ?? '');
    if ($secretId === '' || $secretKey === '') {
        throw new RuntimeException('腾讯云联网图像搜索 SecretId 或 SecretKey 未配置。');
    }

    $host = 'wimgs.tencentcloudapi.com';
    $service = 'wimgs';
    $action = 'SearchByText';
    $version = '2025-11-06';
    $timestamp = time();
    $date = gmdate('Y-m-d', $timestamp);
    $payload = json_encode(['Query' => $query], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $hashedPayload = hash('sha256', (string)$payload);
    $canonicalHeaders = "content-type:application/json; charset=utf-8\nhost:$host\nx-tc-action:" . strtolower($action) . "\n";
    $signedHeaders = 'content-type;host;x-tc-action';
    $canonicalRequest = "POST\n/\n\n$canonicalHeaders\n$signedHeaders\n$hashedPayload";
    $credentialScope = "$date/$service/tc3_request";
    $stringToSign = "TC3-HMAC-SHA256\n$timestamp\n$credentialScope\n" . hash('sha256', $canonicalRequest);
    $secretDate = hash_hmac('sha256', $date, 'TC3' . $secretKey, true);
    $secretService = hash_hmac('sha256', $service, $secretDate, true);
    $secretSigning = hash_hmac('sha256', 'tc3_request', $secretService, true);
    $signature = hash_hmac('sha256', $stringToSign, $secretSigning);
    $authorization = "TC3-HMAC-SHA256 Credential=$secretId/$credentialScope, SignedHeaders=$signedHeaders, Signature=$signature";

    $result = shiguang_http_json('POST', 'https://' . $host, [
        'Authorization: ' . $authorization,
        'Content-Type: application/json; charset=utf-8',
        'Host: ' . $host,
        'X-TC-Action: ' . $action,
        'X-TC-Timestamp: ' . $timestamp,
        'X-TC-Version: ' . $version,
    ], json_decode((string)$payload, true), 20);

    $items = $result['Response']['Images'] ?? [];
    return array_values(array_filter(array_map(static function ($raw) use ($query): array {
        $item = is_string($raw) ? json_decode($raw, true) : $raw;
        if (!is_array($item)) {
            return [];
        }
        return [
            'id' => 'tencent-' . substr(md5((string)($item['origPicUrl'] ?? $item['thumbnailUrl'] ?? $item['title'] ?? uniqid('', true))), 0, 12),
            'provider' => 'tencent-wimgs',
            'category' => $item['siteName'] ?? '腾讯云图片搜索',
            'caption' => $item['title'] ?? $query,
            'url' => $item['origPicUrl'] ?? $item['thumbnailUrl'] ?? '',
            'thumb' => $item['thumbnailUrl'] ?? $item['origPicUrl'] ?? '',
            'author' => $item['siteName'] ?? '',
            'link' => $item['siteUrl'] ?? '',
        ];
    }, $items), static fn (array $item): bool => !empty($item['url'])));
}

function shiguang_media_query_for_destination(string $query, array $destination = [], string $scene = 'place'): string
{
    $name = trim($query !== '' ? $query : (string)($destination['name'] ?? 'travel'));
    $hasChinese = preg_match('/[\x{4e00}-\x{9fff}\x{3400}-\x{4dbf}]/u', $name) === 1;
    $country = trim((string)($destination['country'] ?? ''));
    $tags = $hasChinese ? implode(' ', array_slice($destination['tags'] ?? [], 0, 4)) : '';
    $sceneTerms = [
        'food' => 'local food specialty cuisine',
        'place' => 'travel photography scenic view landscape',
        'map-picked' => 'travel photography scenic view landscape nature culture',
        'gallery' => 'travel photography scenic view landscape',
    ];
    $sceneSuffix = $sceneTerms[$scene] ?? $sceneTerms['place'];
    // For Chinese queries: prepend country in English for better photo search results
    if ($hasChinese && $country !== '') {
        $englishCountry = shiguang_country_english_name($country);
        return trim(($englishCountry ?: $country) . ' ' . $name . ' ' . $tags . ' ' . $sceneSuffix);
    }
    return trim($name . ' ' . $tags . ' ' . $sceneSuffix);
}

/** Map common Chinese country names to English for photo search queries */
function shiguang_country_english_name(string $chineseCountry): string
{
    $map = [
        '中国' => 'China', '瑞士' => 'Switzerland', '摩洛哥' => 'Morocco',
        '新西兰' => 'New Zealand', '葡萄牙' => 'Portugal', '冰岛' => 'Iceland',
        '法国' => 'France', '意大利' => 'Italy', '日本' => 'Japan',
        '西班牙' => 'Spain', '挪威' => 'Norway', '澳大利亚' => 'Australia',
        '美国' => 'USA', '英国' => 'UK', '德国' => 'Germany',
        '泰国' => 'Thailand', '越南' => 'Vietnam', '印度' => 'India',
        '韩国' => 'South Korea', '加拿大' => 'Canada', '希腊' => 'Greece',
        '土耳其' => 'Turkey', '埃及' => 'Egypt', '秘鲁' => 'Peru',
        '墨西哥' => 'Mexico', '巴西' => 'Brazil', '阿根廷' => 'Argentina',
        '荷兰' => 'Netherlands', '比利时' => 'Belgium', '奥地利' => 'Austria',
        '捷克' => 'Czech Republic', '匈牙利' => 'Hungary', '克罗地亚' => 'Croatia',
        '印度尼西亚' => 'Indonesia', '马来西亚' => 'Malaysia', '菲律宾' => 'Philippines',
    ];
    return $map[$chineseCountry] ?? '';
}

function shiguang_media_search(string $query, array $destination = [], string $scene = 'gallery', int $perPage = 12): array
{
    $searchQuery = shiguang_media_query_for_destination($query, $destination, $scene);

    // 中文源专用查询词：始终用目的地中文名+标签，去掉英文干扰
    $cnName = trim((string)($destination['name'] ?? ''));
    $cnCountry = trim((string)($destination['country'] ?? ''));
    $cnTags = implode(' ', array_slice($destination['tags'] ?? [], 0, 4));
    $chineseQuery = trim($cnName . ' ' . $cnCountry . ' ' . $cnTags);
    if ($chineseQuery === '') {
        // 即时选点没有目的地记录，保留前端提供的中文景观摄影限定词。
        $chineseQuery = trim($query !== '' ? $query : $searchQuery);
    }

    $errors = [];
    $images = [];
    $selectedProvider = '';
    $providers = [
        'tencent-wimgs' => static fn () => shiguang_tencent_wimgs_search($searchQuery, $perPage),
        'unsplash' => static fn () => shiguang_unsplash_search($searchQuery, $perPage),
        'pexels' => static fn () => shiguang_pexels_search($searchQuery, $perPage),
        'pixabay' => static fn () => shiguang_pixabay_search($searchQuery, $perPage),
        'apihz-baidu' => static fn () => shiguang_apihz_baidu_search($chineseQuery, $perPage),
        'apihz-sogou' => static fn () => shiguang_apihz_sogou_search($chineseQuery, $perPage),
    ];

    foreach ($providers as $provider => $loader) {
        try {
            $providerImages = [];
            foreach ($loader() as $image) {
                if (!empty($image['url'])) {
                    $providerImages[] = ['provider' => $provider] + $image;
                }
            }
            if ($providerImages) {
                $images = $providerImages;
                $selectedProvider = $provider;
                break;
            }
        } catch (Throwable $error) {
            $errors[$provider] = $error->getMessage();
        }
    }

    $seen = [];
    $images = array_values(array_filter($images, static function (array $image) use (&$seen): bool {
        $key = (string)($image['url'] ?? '');
        if ($key === '' || isset($seen[$key])) {
            return false;
        }
        $seen[$key] = true;
        return true;
    }));
    return [
        'provider' => $selectedProvider,
        'query' => $searchQuery,
        'mode' => $images ? 'live' : 'fallback',
        'errors' => $errors,
        'images' => array_slice($images, 0, max(1, min(60, $perPage))),
    ];
}

function shiguang_amap_geocode(string $address, string $city = ''): array
{
    $key = (string)(shiguang_settings()['map']['webServiceKey'] ?? '');
    if ($key === '') {
        throw new RuntimeException('高德 Web 服务 Key 未配置。');
    }
    $url = 'https://restapi.amap.com/v3/geocode/geo?' . http_build_query([
        'key' => $key,
        'address' => $address,
        'city' => $city,
        'output' => 'JSON',
    ], '', '&', PHP_QUERY_RFC3986);
    return shiguang_http_json('GET', $url);
}

function shiguang_bootstrap(): array
{
    $destinations = shiguang_destinations();
    $users = [shiguang_single_user()];
    $preferences = shiguang_preferences();
    $tripRecords = [
        ['destination' => '厦门', 'date' => '2025-10-02', 'mood' => '松弛', 'cost' => 3600, 'summary' => '你更喜欢有生活感的海边城市，而不是纯打卡景点。'],
        ['destination' => '西安', 'date' => '2024-05-01', 'mood' => '充实', 'cost' => 4200, 'summary' => '你喜欢历史厚度，但需要控制每日景点数量。'],
        ['destination' => '挪威', 'date' => '2023-09-12', 'mood' => '震撼', 'cost' => 16200, 'summary' => '高纬度自然风景明显提高你的满意度。'],
    ];
    return [
        'appName' => '拾光旅图',
        'apiBase' => 'api.php',
        'database' => [
            'driver' => shiguang_mysql_enabled() ? 'mysql' : 'json',
            'fallback' => !shiguang_mysql_enabled(),
        ],
        'settingsPublic' => shiguang_public_settings(),
        'settings' => shiguang_settings(),
        'preferenceMemory' => $preferences,
        'user' => shiguang_single_user(),
        'users' => $users,
        'destinations' => $destinations,
        'recommendations' => (static function () use ($destinations): array {
            $userId = 'single-user';
            $report = shiguang_preference_report($userId, $destinations, false, 'bootstrap');
            return $report['recommendations'] ?? array_map(
                static fn (array $destination, int $index): array => [
                    'id' => 'rec-' . $destination['id'],
                    'score' => max(40, (int)($destination['weight'] ?? 80) - ($index * 2)),
                    'reason' => $destination['name'] . ' 根据当前偏好排序。',
                    'difference' => '保留熟悉的松弛感，但主体体验不重复。',
                    'avoidReason' => '避开旺季核心区，把主行程放在清晨或傍晚。',
                    'destination' => $destination,
                ],
                array_values($destinations),
                array_keys($destinations)
            );
        })(),
        'tripRecords' => $tripRecords,
        'adminStats' => [
            'users' => count($users),
            'destinations' => count($destinations),
            'plans' => count($tripRecords),
            'aiRequests' => count(array_filter($preferences, static fn (array $preference): bool => ($preference['source'] ?? '') === 'chat')),
            'wishlist' => 0,
            'uptime' => shiguang_mysql_enabled() ? 'mysql' : 'json',
        ],
    ];
}

function shiguang_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// ── SSE 流式接口 ────────────────────────────────────────────────────────────────

/**
 * 发送一个 SSE 事件。
 */
function shiguang_sse_emit(string $event, array $data): void
{
    echo "event: {$event}\n";
    echo 'data: ' . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
    if (ob_get_level() > 0) { ob_flush(); }
    flush();
}

/**
 * 初始化 SSE 响应头并关闭输出缓冲。
 */
function shiguang_sse_init(): void
{
    @set_time_limit(0);
    @ini_set('output_buffering', 'off');
    @ini_set('zlib.output_compression', '0');
    while (ob_get_level() > 0) {
        ob_end_flush();
    }
    header('Content-Type: text/event-stream; charset=utf-8');
    header('Cache-Control: no-cache, no-transform');
    header('X-Accel-Buffering: no');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

/**
 * Dify 工作流节点标题 → 公开业务步骤 key 映射（白名单）。
 * 按工作流类型分组：trip / recommend / preference / detail / chat。
 * 每种工作流包含其全部 18-24 个节点的映射，让前端 Stepper 实时显示每步进度。
 */
function shiguang_dify_step_map(string $workflowType = 'trip'): array
{
    $maps = [
        'trip' => [
            '01_接收行程参数' => 'submit',
            '02_参数基础校验' => 'validate_params',
            '03_参数完整性路由' => 'route_check',
            '04_参数错误结束' => 'error_end',
            '05_构建检索查询' => 'kb_query',
            '06_知识库检索偏好' => 'kb_retrieve',
            '07_解析检索结果' => 'kb_parse',
            '08_偏好信号提取' => 'extract_prefs',
            '06_偏好分类统计' => 'stats_prefs',
            '07_目的地知识检索' => 'kb_lookup',
            '08_获取气候数据' => 'weather',
            '09_节假日查询' => 'holidays',
            '10_日期与季节分析' => 'season_analysis',
            '11_预算等级分析' => 'budget_analysis',
            '12_旅行节奏与主题评估' => 'pace_assess',
            '13_目的地亮点预分析' => 'highlights_pre',
            '14_行程骨架生成' => 'skeleton',
            '15_生成每日行程内容' => 'compose',
            '16_行程天数校验' => 'verify_days',
            '17_行程深度润色' => 'polish',
            '18_行程亮点提炼' => 'extract_highlights',
            '19_行程概述生成' => 'overview',
            '20_预算花费估算' => 'estimate',
            '21_出行贴士生成' => 'tips',
            '22_完整结果校验' => 'verify_all',
            '23_JSON 格式化输出' => 'format',
            '24_行程输出' => 'output',
        ],
        'recommend' => [
            '01_接收推荐参数' => 'submit',
            '02_输入数据校验' => 'validate',
            '03_校验结果路由' => 'route_check',
            '04_参数错误结束' => 'error_end',
            '05_构建检索查询' => 'kb_query',
            '06_知识库检索偏好' => 'kb_retrieve',
            '07_解析检索结果' => 'kb_parse',
            '08_偏好信号分类' => 'classify_prefs',
            '06_偏好强度计算' => 'weight_calc',
            '07_候选目的地检查' => 'dest_check',
            '08_无候选结果输出' => 'empty_end',
            '09_目的地信息补全' => 'kb_lookup',
            '10_季节匹配分析' => 'season',
            '11_预算匹配分析' => 'budget_match',
            '12_节奏与特征匹配' => 'pace_match',
            '13_整合评分上下文' => 'build_context',
            '14_候选目的地批量评估' => 'evaluate',
            '15_评分结果校验' => 'verify_scores',
            '16_归一化与排序' => 'sort',
            '17_阈值过滤与冲突标注' => 'filter',
            '18_推荐报告生成' => 'report',
            '19_报告格式化' => 'format',
            '20_最终校验与包装' => 'verify_all',
            '21_推荐输出' => 'output',
        ],
        'preference' => [
            '01_接收偏好数据' => 'submit',
            '02_构建检索查询' => 'kb_query',
            '03_知识库检索偏好' => 'kb_retrieve',
            '04_解析检索结果' => 'kb_parse',
            '05_偏好数据整理' => 'clean',
            '03_偏好数据路由' => 'route_check',
            '04_无活跃偏好输出' => 'empty_end',
            '05_偏好状态分类' => 'status_classify',
            '06_偏好类型细分' => 'type_classify',
            '07_偏好主题归类' => 'theme_classify',
            '08_偏好冲突检测' => 'conflict_check',
            '09_信号强度评分' => 'signal_strength',
            '10_偏好标签提取' => 'extract_tags',
            '11_用户画像分析' => 'analyze',
            '12_待确认问题生成' => 'questions',
            '13_综合置信度评估' => 'confidence',
            '14_画像报告生成' => 'report',
            '15_报告结果校验' => 'verify',
            '16_报告格式化' => 'format',
            '17_最终包装输出' => 'wrap',
            '18_画像输出' => 'output',
        ],
        'detail' => [
            '01_接收目的地参数' => 'submit',
            '02_参数校验' => 'validate',
            '03_参数合法性路由' => 'route_check',
            '04_参数错误结束' => 'error_end',
            '05_目的地知识检索' => 'kb_lookup',
            '06_获取实时气候数据' => 'weather',
            '07_季节与最佳时间分析' => 'season_analysis',
            '08_构建检索查询' => 'kb_query',
            '09_知识库检索偏好' => 'kb_retrieve',
            '10_解析检索结果' => 'kb_parse',
            '11_用户偏好匹配分析' => 'pref_match',
            '09_目的地画像构建' => 'build_context',
            '10_目的地关键特征提取' => 'extract_features',
            '11_适合度与亮点分析' => 'suitability',
            '12_地理与路线规划' => 'geo_route',
            '13_预算与实用信息生成' => 'practical',
            '14_段落内容润色' => 'polish',
            '15_所有内容聚合' => 'merge',
            '16_必填字段校验' => 'verify_fields',
            '17_数组字段校验' => 'verify_arrays',
            '18_内容质量评分' => 'quality',
            '19_格式化与包装输出' => 'format',
            '20_详情输出' => 'output',
        ],
        'chat' => [
            '01_接收用户消息' => 'receive',
            '02_会话历史压缩' => 'compress',
            '03_构建检索查询' => 'kb_query',
            '04_知识库检索偏好' => 'kb_retrieve',
            '05_生成偏好上下文' => 'kb_parse',
            '03_用户意图分类' => 'classify',
            '04_意图路由' => 'route',
            '05a_提取行程约束' => 'extract_trip',
            '06a_检索目的地知识' => 'kb_trip',
            '07a_获取气候数据' => 'weather_trip',
            '08a_生成初步方案' => 'compose_trip',
            '09a_信息完整性检查' => 'check_complete',
            '10a_信息充分性路由' => 'route_complete',
            '11a_输出完整建议' => 'answer_trip',
            '11b_输出含追问的建议' => 'ask_followup',
            '05b_识别新偏好' => 'extract_pref',
            '06b_偏好格式校验' => 'validate_pref',
            '07b_生成偏好确认话术' => 'confirm_pref',
            '08b_输出偏好确认' => 'answer_pref',
            '05c_深度分析需求' => 'analyze_general',
            '06c_检索相关知识' => 'kb_general',
            '07c_获取实时数据' => 'data_general',
            '08c_生成顾问建议' => 'compose_general',
            '09c_敏感内容检查' => 'sensitive_check',
            '10c_输出建议' => 'answer_general',
        ],
    ];
    return $maps[$workflowType] ?? $maps['trip'];
}

/**
 * 将 Dify 节点事件转换为公开步骤事件。
 * 返回 null 表示该节点不在白名单中，应忽略。
 * @param string $workflowType trip|recommend|preference|detail|chat
 */
function shiguang_dify_map_node_event(array $eventData, string $workflowType = 'trip'): ?array
{
    $title = trim((string)($eventData['data']['title'] ?? $eventData['title'] ?? ''));
    $map = shiguang_dify_step_map($workflowType);
    $key = $map[$title] ?? null;
    if ($key === null) {
        return null;
    }
    $eventType = (string)($eventData['event'] ?? '');
    $status = 'running';
    if ($eventType === 'node_finished' || $eventType === 'node_succeeded') {
        $status = 'completed';
    } elseif ($eventType === 'node_failed') {
        $status = 'failed';
    }
    // 附带原始节点标题作为 label，让前端显示真实节点名
    return ['key' => $key, 'label' => $title, 'status' => $status];
}

/**
 * 读取 Dify SSE 流并逐个解析事件，通过回调处理。
 * 返回最终收集的数据（workflow_run_id 等）。
 */
function shiguang_dify_read_sse_stream($handle, callable $onEvent): array
{
    $buffer = '';
    $meta = ['workflow_run_id' => '', 'task_id' => ''];

    while (!feof($handle)) {
        $chunk = fread($handle, 8192);
        if ($chunk === false || $chunk === '') {
            usleep(50000);
            continue;
        }
        $buffer .= $chunk;
        // 按空行分隔事件
        $parts = preg_split("/(\r?\n){2,}/", $buffer);
        // 最后一个可能不完整
        $buffer = array_pop($parts) ?? '';

        foreach ($parts as $block) {
            $block = trim($block);
            if ($block === '') continue;
            $lines = preg_split('/\r?\n/', $block);
            $eventType = '';
            $dataLines = [];
            foreach ($lines as $line) {
                if (stripos($line, 'event:') === 0) {
                    $eventType = trim(substr($line, 6));
                } elseif (stripos($line, 'data:') === 0) {
                    $dataLines[] = trim(substr($line, 5));
                }
            }
            if (empty($dataLines)) continue;

            $dataJson = implode('', $dataLines);
            $data = json_decode($dataJson, true);
            if (!is_array($data)) continue;

            // 提取 meta
            if (!empty($data['workflow_run_id'])) {
                $meta['workflow_run_id'] = (string)$data['workflow_run_id'];
            }
            if (!empty($data['task_id'])) {
                $meta['task_id'] = (string)$data['task_id'];
            }

            $eventType = $eventType ?: (string)($data['event'] ?? '');
            $onEvent($eventType, $data);
        }
    }

    // 处理剩余 buffer
    $block = trim($buffer);
    if ($block !== '') {
        $dataLines = [];
        foreach (preg_split('/\r?\n/', $block) as $line) {
            if (stripos($line, 'data:') === 0) {
                $dataLines[] = trim(substr($line, 5));
            }
        }
        if (!empty($dataLines)) {
            $data = json_decode(implode('', $dataLines), true);
            if (is_array($data)) {
                $eventType = (string)($data['event'] ?? '');
                $onEvent($eventType, $data);
            }
        }
    }

    return $meta;
}

/**
 * 流式行程生成（Dify Workflow streaming → 项目 SSE）。
 */
function shiguang_sse_stream_trip(array $input): void
{
    shiguang_sse_init();

    $destination = trim((string)($input['destination'] ?? ''));
    if ($destination === '') {
        shiguang_sse_emit('error', ['message' => 'destination 不能为空。']);
        return;
    }
    $days = max(1, min(14, (int)($input['days'] ?? 5)));
    $budget = trim((string)($input['budget'] ?? '均衡'));
    $pace = trim((string)($input['pace'] ?? '慢游'));
    $tags = is_array($input['tags'] ?? null) ? array_values($input['tags']) : [];
    $currentUser = shiguang_single_user();
    $userId = trim((string)($currentUser['id'] ?? 'guest')) ?: 'guest';

    shiguang_sse_emit('workflow', ['status' => 'started']);

    // 尝试 Dify 流式
    if (shiguang_dify_configured('task')) {
        $difyInputs = [
            'destination' => $destination,
            'days' => $days,
            'budget' => $budget,
            'pace' => $pace,
            'tags_json' => json_encode($tags, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'user_id' => $userId,
            'current_date' => date('Y-m-d'),
        ];
        try {
            $result = shiguang_dify_stream_workflow($difyInputs, $userId, function (string $eventType, array $data) {
                if ($eventType === 'workflow_started') {
                    shiguang_sse_emit('workflow', ['status' => 'started', 'workflow_run_id' => (string)($data['workflow_run_id'] ?? '')]);
                } elseif (in_array($eventType, ['node_started', 'node_finished', 'node_succeeded', 'node_failed'], true)) {
                    $step = shiguang_dify_map_node_event($data);
                    if ($step !== null) {
                        shiguang_sse_emit('step', $step);
                    }
                } elseif (in_array($eventType, ['workflow_finished', 'workflow_succeeded'], true)) {
                    // 不在这里 emit complete
                } elseif ($eventType === 'workflow_failed') {
                    shiguang_sse_emit('error', ['message' => 'Dify 工作流执行失败。']);
                }
            }, 'trip');
            if ($result['status'] === 'succeeded') {
                $plan = shiguang_dify_extract_task_result($result['response'] ?? $result, 'trip_plan');
                $raw = json_encode($result['response']['data']['outputs'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $normalized = shiguang_normalize_trip_plan($plan, ['destination' => $destination, 'days' => $days, 'budget' => $budget, 'pace' => $pace, 'tags' => $tags], 'dify-workflow', $raw ?: '');
                shiguang_sse_emit('complete', ['plan' => $normalized]);
                return;
            }
            throw new RuntimeException('Dify 流式工作流未成功完成。');
        } catch (Throwable $error) {
            shiguang_sse_emit('fallback', ['status' => 'running', 'label' => '正在切换备用生成引擎']);
        }
    }

    // SSE 流式失败 — 不发射本地兜底 complete，让前端自动走阻塞 API 兜底
    // 前端 SSE 流结束后拿不到 finalPlan，会调用 /api/trips/generate（阻塞模式）获得 Dify 结果
}

/**
 * 通过 cURL 调用 Dify Workflow streaming 并回调每个事件。
 * @param string $workflowType '' 则使用 taskWorkflowApiKey，否则用对应类型专用 Key
 */
function shiguang_dify_stream_workflow(array $inputs, string $userId, callable $onEvent, string $workflowType = ''): array
{
    $settings = shiguang_settings()['dify'] ?? [];
    $baseUrl = rtrim(trim((string)($settings['baseUrl'] ?? '')), '/');
    $apiKey = $workflowType !== '' ? shiguang_dify_api_key_for($workflowType) : trim((string)($settings['taskWorkflowApiKey'] ?? ''));
    $timeout = max(5, min(300, (int)($settings['timeout'] ?? 90)));

    if ($baseUrl === '' || $apiKey === '') {
        throw new RuntimeException('Dify 未配置。');
    }

    $payload = json_encode([
        'inputs' => $inputs,
        'response_mode' => 'streaming',
        'user' => $userId !== '' ? $userId : 'guest',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $url = $baseUrl . '/workflows/run';
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'Accept: text/event-stream',
        ],
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HEADER => false,
        CURLOPT_ENCODING => '',
    ]);

    $ca = __DIR__ . '/runtime/php/extras/ssl/cacert.pem';
    if (is_file($ca)) {
        curl_setopt($curl, CURLOPT_CAINFO, $ca);
    }

    $finalResponse = ['status' => 'unknown', 'response' => null];
    $responseBuffer = '';

    curl_setopt($curl, CURLOPT_WRITEFUNCTION, static function ($curl, $chunk) use ($onEvent, &$finalResponse, &$responseBuffer) {
        $responseBuffer .= $chunk;
        // Parse SSE events from the buffer
        $parts = preg_split("/(\r?\n){2,}/", $responseBuffer);
        $responseBuffer = array_pop($parts) ?? '';

        foreach ($parts as $block) {
            $block = trim($block);
            if ($block === '') continue;
            $lines = preg_split('/\r?\n/', $block);
            $eventType = '';
            $dataLines = [];
            foreach ($lines as $line) {
                if (stripos($line, 'event:') === 0) {
                    $eventType = trim(substr($line, 6));
                } elseif (stripos($line, 'data:') === 0) {
                    $dataLines[] = trim(substr($line, 5));
                }
            }
            if (empty($dataLines)) continue;

            $dataJson = implode('', $dataLines);
            $data = json_decode($dataJson, true);
            if (!is_array($data)) continue;

            $eventType = $eventType ?: (string)($data['event'] ?? '');

            // 捕获最终响应
            if ($eventType === 'workflow_finished' || $eventType === 'workflow_succeeded') {
                $finalResponse['status'] = 'succeeded';
                if (!empty($data['data'])) {
                    $finalResponse['response'] = $data;
                }
            } elseif ($eventType === 'workflow_failed') {
                $finalResponse['status'] = 'failed';
                $finalResponse['response'] = $data;
            }

            $onEvent($eventType, $data);
        }
        return strlen($chunk);
    });

    curl_exec($curl);
    $httpStatus = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    // 处理流结束后残留在缓冲区中的最后一个事件（可能没有尾随空行）
    if ($responseBuffer !== '') {
        $parts = preg_split("/(\r?\n){2,}/", $responseBuffer);
        foreach ($parts as $block) {
            $block = trim($block);
            if ($block === '') continue;
            $lines = preg_split('/\r?\n/', $block);
            $eventType = '';
            $dataLines = [];
            foreach ($lines as $line) {
                if (stripos($line, 'event:') === 0) {
                    $eventType = trim(substr($line, 6));
                } elseif (stripos($line, 'data:') === 0) {
                    $dataLines[] = trim(substr($line, 5));
                }
            }
            if (empty($dataLines)) continue;
            $dataJson = implode('', $dataLines);
            $data = json_decode($dataJson, true);
            if (!is_array($data)) continue;
            $eventType = $eventType ?: (string)($data['event'] ?? '');
            if ($eventType === 'workflow_finished' || $eventType === 'workflow_succeeded') {
                $finalResponse['status'] = 'succeeded';
                if (!empty($data['data'])) {
                    $finalResponse['response'] = $data;
                }
            } elseif ($eventType === 'workflow_failed') {
                $finalResponse['status'] = 'failed';
                $finalResponse['response'] = $data;
            }
            $onEvent($eventType, $data);
        }
    }

    if ($error !== '') {
        throw new RuntimeException('Dify 流式连接失败: ' . $error);
    }
    if ($httpStatus < 200 || $httpStatus >= 300) {
        throw new RuntimeException('Dify 返回 HTTP ' . $httpStatus);
    }

    return $finalResponse;
}

/**
 * 流式 AI 顾问对话（Dify Chatflow streaming → 项目 SSE）。
 */
function shiguang_sse_stream_chat(array $input): void
{
    shiguang_sse_init();

    $message = trim((string)($input['message'] ?? ''));
    if ($message === '') {
        shiguang_sse_emit('error', ['message' => 'message 不能为空。']);
        return;
    }
    $conversationId = trim((string)($input['conversation_id'] ?? ''));
    $currentRoute = trim((string)($input['current_route'] ?? 'advisor'));
    $currentUser = shiguang_single_user();
    $userId = trim((string)($currentUser['id'] ?? 'guest')) ?: 'guest';

    // 尝试 Dify Chatflow 流式
    if (shiguang_dify_configured('chat')) {
        try {
            $payload = [
                'inputs' => $conversationId === '' ? [
                    'user_id' => $userId,
                    'current_route' => $currentRoute,
                ] : new stdClass(),
                'query' => $message,
                'conversation_id' => $conversationId,
                'user' => $userId,
                'response_mode' => 'streaming',
            ];
            $result = shiguang_dify_stream_chat_curl($payload, function (string $eventType, array $data) {
                if ($eventType === 'message') {
                    $answer = (string)($data['answer'] ?? '');
                    $answer = shiguang_dify_strip_thinking($answer);
                    shiguang_sse_emit('message', [
                        'content' => $answer,
                        'conversation_id' => (string)($data['conversation_id'] ?? ''),
                    ]);
                } elseif ($eventType === 'message_end') {
                    shiguang_sse_emit('done', [
                        'conversation_id' => (string)($data['conversation_id'] ?? ''),
                    ]);
                } elseif ($eventType === 'error') {
                    shiguang_sse_emit('error', ['message' => (string)($data['message'] ?? 'Dify 返回错误。')]);
                } elseif (in_array($eventType, ['node_started', 'node_succeeded', 'node_finished', 'node_failed'], true)) {
                    $step = shiguang_dify_map_node_event($data, 'chat');
                    if ($step !== null) {
                        shiguang_sse_emit('step', $step);
                    }
                }
            });
            if ($result['success']) {
                return;
            }
        } catch (Throwable $error) {
            $errorMsg = $error->getMessage();
            error_log('[拾光旅图] Dify Chatflow 流式调用失败: ' . $errorMsg);
            shiguang_sse_emit('fallback', ['status' => 'running', 'label' => 'Dify 连接失败，改用备用回复', 'error' => $errorMsg]);
        }
    }

    // 回退到阻塞式 AI 回复
    $reply = shiguang_ai_reply($message, null, $conversationId, $currentRoute);
    shiguang_sse_emit('message', [
        'content' => $reply['content'],
        'conversation_id' => $reply['conversationId'] ?? $conversationId,
    ]);
    shiguang_sse_emit('done', [
        'conversation_id' => $reply['conversationId'] ?? $conversationId,
        'provider' => $reply['provider'],
    ]);
}

/**
 * 通过 cURL 调用 Dify Chatflow streaming。
 */
function shiguang_dify_stream_chat_curl(array $payload, callable $onEvent): array
{
    $settings = shiguang_settings()['dify'] ?? [];
    $baseUrl = rtrim(trim((string)($settings['baseUrl'] ?? '')), '/');
    $apiKey = trim((string)($settings['chatflowApiKey'] ?? ''));
    $timeout = max(5, min(300, (int)($settings['timeout'] ?? 90)));

    if ($baseUrl === '' || $apiKey === '') {
        throw new RuntimeException('Dify Chatflow 未配置。');
    }

    $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $url = $baseUrl . '/chat-messages';
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payloadJson,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'Accept: text/event-stream',
        ],
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HEADER => false,
    ]);

    $ca = __DIR__ . '/runtime/php/extras/ssl/cacert.pem';
    if (is_file($ca)) {
        curl_setopt($curl, CURLOPT_CAINFO, $ca);
    }

    $result = ['success' => false, 'conversation_id' => ''];
    $responseBuffer = '';

    curl_setopt($curl, CURLOPT_WRITEFUNCTION, static function ($curl, $chunk) use ($onEvent, &$result, &$responseBuffer) {
        $responseBuffer .= $chunk;
        $parts = preg_split("/(\r?\n){2,}/", $responseBuffer);
        $responseBuffer = array_pop($parts) ?? '';

        foreach ($parts as $block) {
            $block = trim($block);
            if ($block === '') continue;
            $lines = preg_split('/\r?\n/', $block);
            $eventType = '';
            $dataLines = [];
            foreach ($lines as $line) {
                if (stripos($line, 'event:') === 0) {
                    $eventType = trim(substr($line, 6));
                } elseif (stripos($line, 'data:') === 0) {
                    $dataLines[] = trim(substr($line, 5));
                }
            }
            if (empty($dataLines)) continue;

            $dataJson = implode('', $dataLines);
            $data = json_decode($dataJson, true);
            if (!is_array($data)) continue;

            $eventType = $eventType ?: (string)($data['event'] ?? '');

            if (!empty($data['conversation_id'])) {
                $result['conversation_id'] = (string)$data['conversation_id'];
            }
            if ($eventType === 'message' || $eventType === 'message_end') {
                $result['success'] = true;
            }

            $onEvent($eventType, $data);
        }
        return strlen($chunk);
    });

    curl_exec($curl);
    $httpStatus = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($error !== '') {
        error_log('[拾光旅图] Dify Chatflow 流式 cURL 错误: ' . $error . ' | URL: ' . $url);
        throw new RuntimeException('Dify Chatflow 流式连接失败: ' . $error);
    }
    if ($httpStatus < 200 || $httpStatus >= 300) {
        error_log('[拾光旅图] Dify Chatflow 返回 HTTP ' . $httpStatus . ' | URL: ' . $url);
        throw new RuntimeException('Dify Chatflow 返回 HTTP ' . $httpStatus);
    }

    return $result;
}

/**
 * 根据工作流类型获取对应的 Dify API Key。
 * 优先使用专用 Key（trip/recommend/preference/detail），回退到通用 taskWorkflowApiKey。
 */
function shiguang_dify_api_key_for(string $workflowType): string
{
    $settings = shiguang_settings()['dify'] ?? [];
    $keyMap = [
        'trip' => 'tripWorkflowApiKey',
        'recommend' => 'recommendWorkflowApiKey',
        'preference' => 'preferenceWorkflowApiKey',
        'detail' => 'detailWorkflowApiKey',
    ];
    $key = trim((string)($settings[$keyMap[$workflowType] ?? ''] ?? ''));
    if ($key === '') {
        $key = trim((string)($settings['taskWorkflowApiKey'] ?? ''));
    }
    return $key;
}

/**
 * 流式推荐刷新（Dify Workflow streaming → 项目 SSE）。
 */
function shiguang_sse_stream_recommend(array $input): void
{
    shiguang_sse_init();

    $userId = trim((string)($input['user_id'] ?? shiguang_single_user()['id'] ?? 'guest')) ?: 'guest';
    $destinations = $input['destinations'] ?? [];
    if (empty($destinations)) {
        $destinations = shiguang_destinations();
    }
    $force = !empty($input['force']);

    shiguang_sse_emit('workflow', ['status' => 'started', 'workflow_type' => 'recommend']);

    if (shiguang_dify_configured('task')) {
        $difyInputs = [
            'destinations_json' => json_encode($destinations, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'user_id' => $userId,
            'current_date' => date('Y-m-d'),
        ];
        try {
            $result = shiguang_dify_stream_workflow($difyInputs, $userId, function (string $eventType, array $data) {
                if ($eventType === 'workflow_started') {
                    // skip, already emitted
                } elseif (in_array($eventType, ['node_started', 'node_finished', 'node_succeeded', 'node_failed'], true)) {
                    $step = shiguang_dify_map_node_event($data, 'recommend');
                    if ($step !== null) {
                        shiguang_sse_emit('step', $step);
                    }
                } elseif ($eventType === 'workflow_failed') {
                    shiguang_sse_emit('error', ['message' => 'Dify 推荐工作流执行失败。']);
                }
            }, 'recommend');
            if ($result['status'] === 'succeeded') {
                $plan = shiguang_dify_extract_task_result($result['response'] ?? $result, 'recommend_refresh');
                shiguang_sse_emit('complete', ['plan' => $plan]);
                return;
            }
            throw new RuntimeException('Dify 流式推荐工作流未成功完成。');
        } catch (Throwable $error) {
            shiguang_sse_emit('fallback', ['status' => 'running', 'label' => '正在切换备用推荐引擎']);
        }
    }

    // 回退到本地推荐 — 发射模拟步骤
    $fallbackSteps = [
        ['key' => 'submit', 'status' => 'completed'],
        ['key' => 'classify_prefs', 'status' => 'completed'],
        ['key' => 'evaluate', 'status' => 'running'],
    ];
    foreach ($fallbackSteps as $i => $s) {
        if ($i > 0) { usleep(100000); }
        shiguang_sse_emit('step', $s);
    }
    $report = shiguang_preference_report($userId, $destinations, $force, 'stream-fallback');
    usleep(80000);
    shiguang_sse_emit('step', ['key' => 'evaluate', 'status' => 'completed']);
    usleep(80000);
    shiguang_sse_emit('step', ['key' => 'output', 'status' => 'completed']);
    shiguang_sse_emit('complete', ['plan' => $report]);
}

/**
 * 流式偏好画像分析（Dify Workflow streaming → 项目 SSE）。
 */
function shiguang_sse_stream_preference(array $input): void
{
    shiguang_sse_init();

    $userId = trim((string)($input['user_id'] ?? shiguang_single_user()['id'] ?? 'guest')) ?: 'guest';

    shiguang_sse_emit('workflow', ['status' => 'started', 'workflow_type' => 'preference']);

    if (shiguang_dify_configured('task')) {
        $difyInputs = [
            'user_id' => $userId,
            'current_date' => date('Y-m-d'),
        ];
        try {
            $result = shiguang_dify_stream_workflow($difyInputs, $userId, function (string $eventType, array $data) {
                if ($eventType === 'workflow_started') {
                    // skip
                } elseif (in_array($eventType, ['node_started', 'node_finished', 'node_succeeded', 'node_failed'], true)) {
                    $step = shiguang_dify_map_node_event($data, 'preference');
                    if ($step !== null) {
                        shiguang_sse_emit('step', $step);
                    }
                } elseif ($eventType === 'workflow_failed') {
                    shiguang_sse_emit('error', ['message' => 'Dify 偏好画像工作流执行失败。']);
                }
            }, 'preference');
            if ($result['status'] === 'succeeded') {
                $plan = shiguang_dify_extract_task_result($result['response'] ?? $result, 'preference_refresh');
                shiguang_sse_emit('complete', ['plan' => $plan]);
                return;
            }
            throw new RuntimeException('Dify 流式偏好画像工作流未成功完成。');
        } catch (Throwable $error) {
            shiguang_sse_emit('fallback', ['status' => 'running', 'label' => '正在切换备用画像引擎']);
        }
    }

    // 回退到本地画像分析
    $preferences = shiguang_preferences($userId);
    $report = [
        'title' => '旅行偏好画像',
        'summary' => '基于本地规则生成的偏好画像。',
        'likes' => array_values(array_filter(array_map(static fn ($p) => $p['title'] ?? '', array_filter($preferences, static fn ($p) => ($p['type'] ?? '') === 'like' && ($p['status'] ?? '') === 'confirmed')))),
        'avoids' => array_values(array_filter(array_map(static fn ($p) => $p['title'] ?? '', array_filter($preferences, static fn ($p) => ($p['type'] ?? '') === 'avoid' && ($p['status'] ?? '') === 'confirmed')))),
        'confirmedCount' => count(array_filter($preferences, static fn ($p) => ($p['status'] ?? '') === 'confirmed')),
        'pendingCount' => count(array_filter($preferences, static fn ($p) => ($p['status'] ?? '') === 'pending')),
        'generatedAt' => date('Y-m-d'),
    ];
    shiguang_sse_emit('complete', ['plan' => $report]);
}

/**
 * 流式目的地详情（Dify Workflow streaming → 项目 SSE）。
 */
function shiguang_sse_stream_detail(array $input): void
{
    shiguang_sse_init();

    $destination = $input['destination'] ?? [];
    $destName = trim((string)($destination['name'] ?? $input['destination_name'] ?? ''));
    if ($destName === '') {
        shiguang_sse_emit('error', ['message' => 'destination_name 不能为空。']);
        return;
    }
    $userId = trim((string)($input['user_id'] ?? shiguang_single_user()['id'] ?? 'guest')) ?: 'guest';
    $force = !empty($input['force']);

    shiguang_sse_emit('workflow', ['status' => 'started', 'workflow_type' => 'detail']);

    if (shiguang_dify_configured('task')) {
        $difyInputs = [
            'destination_json' => json_encode($destination, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'current_date' => date('Y-m-d'),
            'user_id' => $userId,
        ];
        try {
            $result = shiguang_dify_stream_workflow($difyInputs, $userId, function (string $eventType, array $data) {
                if ($eventType === 'workflow_started') {
                    // skip
                } elseif (in_array($eventType, ['node_started', 'node_finished', 'node_succeeded', 'node_failed'], true)) {
                    $step = shiguang_dify_map_node_event($data, 'detail');
                    if ($step !== null) {
                        shiguang_sse_emit('step', $step);
                    }
                } elseif ($eventType === 'workflow_failed') {
                    shiguang_sse_emit('error', ['message' => 'Dify 目的地详情工作流执行失败。']);
                }
            }, 'detail');
            if ($result['status'] === 'succeeded') {
                $plan = shiguang_dify_extract_task_result($result['response'] ?? $result, 'destination_detail');
                shiguang_sse_emit('complete', ['plan' => $plan]);
                return;
            }
            throw new RuntimeException('Dify 流式目的地详情工作流未成功完成。');
        } catch (Throwable $error) {
            shiguang_sse_emit('fallback', ['status' => 'running', 'label' => '正在切换备用详情引擎']);
        }
    }

    // 回退到本地详情
    $detail = shiguang_destination_detail($destination, $force);
    shiguang_sse_emit('complete', ['plan' => $detail]);
}

/**
 * API 连通性诊断检查。
 * 逐一测试各 API 的配置完整性和可达性。
 */
function shiguang_diagnostic_check(): array
{
    $settings = shiguang_settings();
    $results = [];

    // 1. Dify Chatflow
    $dify = $settings['dify'] ?? [];
    $difyOk = !empty($dify['enabled']) && !empty($dify['baseUrl']) && !empty($dify['chatflowApiKey']);
    $difyHostReachable = false;
    $difyError = '';

    if ($difyOk) {
        try {
            $parsed = parse_url($dify['baseUrl']);
            $host = ($parsed['scheme'] ?? 'http') . '://' . ($parsed['host'] ?? '');
            $port = $parsed['port'] ?? '';
            if ($port) $host .= ':' . $port;
            // 尝试连接服务器（超时 5 秒）
            $ch = curl_init($host);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_NOBODY => true,
            ]);
            curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErr = curl_error($ch);
            curl_close($ch);
            if ($httpCode > 0) {
                $difyHostReachable = true;
                $difyError = "HTTP {$httpCode}";
            } else {
                $difyError = $curlErr ?: '无法连接';
            }
        } catch (Throwable $e) {
            $difyError = $e->getMessage();
        }
    }

    $results['dify'] = [
        'configured' => $difyOk,
        'reachable' => $difyHostReachable,
        'baseUrl' => $dify['baseUrl'] ?? '',
        'hasChatflowKey' => !empty($dify['chatflowApiKey']),
        'hasTaskKey' => !empty($dify['taskWorkflowApiKey']),
        'detail' => !$difyOk ? 'Dify 未启用或配置不完整' : ($difyHostReachable ? ($difyError ?: '连通') : '无法连接: ' . $difyError),
    ];

    // 2. 高德地图
    $map = $settings['map'] ?? [];
    $results['amap'] = [
        'configured' => !empty($map['jsKey']),
        'hasJsKey' => !empty($map['jsKey']),
        'hasSecurityCode' => !empty($map['securityJsCode']),
        'hasWebServiceKey' => !empty($map['webServiceKey']),
        'detail' => empty($map['jsKey']) ? 'JS Key 未配置' : '已配置',
    ];

    // 3. Unsplash
    $unsplash = $settings['unsplash'] ?? [];
    $results['unsplash'] = [
        'configured' => !empty($unsplash['accessKey']),
        'detail' => empty($unsplash['accessKey']) ? 'Access Key 未配置' : '已配置',
    ];

    // 4. 图片搜索源
    $media = $settings['media'] ?? [];
    $pexelsOk = !empty($media['pexelsApiKey']);
    $pixabayOk = !empty($media['pixabayApiKey']);
    $tencentOk = !empty($media['tencentSecretId']) && !empty($media['tencentSecretKey']);
    $apihzOk = !empty($media['apihzId']) && !empty($media['apihzKey']);

    $results['media'] = [
        'pexels' => $pexelsOk,
        'pixabay' => $pixabayOk,
        'tencent' => $tencentOk,
        'apihz' => $apihzOk,
        'detail' => (!$pexelsOk && !$pixabayOk && !$tencentOk && !$apihzOk) ? '所有图片源均未配置' : '部分已配置',
    ];

    // 5. AI 供应商
    $ai = $settings['ai'] ?? [];
    $deepseekOk = !empty($ai['deepseek']['apiKey']);
    $doubaoOk = !empty($ai['doubao']['apiKey']);
    $openaiOk = !empty($ai['openaiCompatible']['apiKey']);

    $results['ai'] = [
        'defaultProvider' => $ai['defaultProvider'] ?? 'deepseek',
        'deepseek' => $deepseekOk,
        'doubao' => $doubaoOk,
        'openaiCompatible' => $openaiOk,
        'detail' => (!$deepseekOk && !$doubaoOk && !$openaiOk) ? '所有 AI 供应商均未配置 API Key' : '部分已配置',
    ];

    return $results;
}
