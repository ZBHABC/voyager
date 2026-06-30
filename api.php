<?php
declare(strict_types=1);

require __DIR__ . '/data.php';

$path = trim((string)($_GET['path'] ?? ''), '/');
$rawInput = file_get_contents('php://input');
$jsonInput = $rawInput ? json_decode($rawInput, true) : [];
if (!is_array($jsonInput)) {
    $jsonInput = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    shiguang_json(['ok' => true]);
    exit;
}

try {
    $bootstrap = shiguang_bootstrap();

    switch ($path) {
        case '':
        case 'health':
            shiguang_json([
                'ok' => true,
                'name' => '拾光旅图 PHP API',
                'database' => [
                    'driver' => shiguang_mysql_enabled() ? 'mysql' : 'json',
                    'fallback' => !shiguang_mysql_enabled(),
                ],
                'integrations' => shiguang_public_settings(),
            ]);
            break;

        // ── 目的地 ──────────────────────────────────────────────────────
        case 'destinations/list':
            shiguang_json(['destinations' => $bootstrap['destinations']]);
            break;

        case 'destinations/detail':
            $destinationId = trim((string)($_GET['id'] ?? $jsonInput['id'] ?? ''));
            $force = !empty($_GET['force']) || !empty($jsonInput['force']);
            $destination = null;
            foreach ($bootstrap['destinations'] as $candidate) {
                if (($candidate['id'] ?? '') === $destinationId || ($candidate['name'] ?? '') === $destinationId) {
                    $destination = $candidate;
                    break;
                }
            }
            if (!$destination && $destinationId === 'map-picked') {
                $name = trim((string)($jsonInput['name'] ?? ''));
                if ($name) {
                    $destination = [
                        'id' => 'map-picked-' . md5($name),
                        'name' => $name,
                        'country' => trim((string)($jsonInput['country'] ?? '')),
                        'region' => trim((string)($jsonInput['region'] ?? '')),
                        'lat' => (float)($jsonInput['lat'] ?? 0),
                        'lng' => (float)($jsonInput['lng'] ?? 0),
                        'summary' => trim((string)($jsonInput['intro'] ?? '')),
                        'tags' => ['城市漫游', '自由探索'],
                        'budget' => '待确认',
                        'days' => 1,
                        'img' => 'city',
                        'season' => '即时选点',
                        'weight' => 100,
                    ];
                }
            }
            if (!$destination) {
                shiguang_json(['error' => '目的地不存在。'], 404);
                break;
            }
            $detail = shiguang_destination_detail($destination, $force);
            shiguang_json($detail);
            break;

        case 'destinations/recommend':
            $force = !empty($_GET['force']) || !empty($jsonInput['force']);
            $userId = 'single-user';
            $report = shiguang_preference_report($userId, $bootstrap['destinations'], $force, $force ? 'manual-refresh' : 'read');
            shiguang_json([
                'recommendations' => $report['recommendations'] ?? [],
                'report' => $report,
            ]);
            break;

        // ── 行程 ────────────────────────────────────────────────────────
        case 'trips/records':
            shiguang_json(['records' => $bootstrap['tripRecords']]);
            break;

        case 'trips/plans':
            // 行程历史由前端 localStorage 管理，后端返回空列表作为引导。
            shiguang_json(['plans' => []]);
            break;

        case 'trips/generate-stream':
            shiguang_sse_stream_trip($jsonInput);
            break;

        case 'trips/generate':
            $plan = shiguang_generate_trip_plan($jsonInput);
            shiguang_json(['plan' => $plan]);
            break;

        // ── 推荐刷新流式 ───────────────────────────────────────────────
        case 'recommend/stream':
            shiguang_sse_stream_recommend($jsonInput);
            break;

        // ── 偏好画像流式 ───────────────────────────────────────────────
        case 'preferences/stream':
            shiguang_sse_stream_preference($jsonInput);
            break;

        // ── 目的地详情流式 ─────────────────────────────────────────────
        case 'destinations/detail-stream':
            shiguang_sse_stream_detail($jsonInput);
            break;

        // ── AI 对话 ──────────────────────────────────────────────────────
        case 'ai/chat-stream':
            shiguang_sse_stream_chat($jsonInput);
            break;

        case 'ai/chat':
            $userMessage = trim((string)($jsonInput['message'] ?? ''));
            $conversationId = trim((string)($jsonInput['conversation_id'] ?? ''));
            $currentRoute = trim((string)($jsonInput['current_route'] ?? 'advisor'));
            if ($userMessage === '') {
                shiguang_json(['error' => 'message 不能为空。'], 422);
                break;
            }
            // 从消息提取偏好
            try {
                $memory = shiguang_upsert_preference([
                    'text' => $userMessage,
                    'source' => 'chat',
                    'status' => 'pending',
                    'confidence' => 0.7,
                ]);
            } catch (InvalidArgumentException) {
                $memory = null;
            }
            // Dify Chatflow 阻塞式调用
            $reply = shiguang_ai_reply($userMessage, $conversationId, $currentRoute);
            shiguang_json([
                'message' => [
                    'role' => 'assistant',
                    'content' => $reply['content'],
                    'provider' => $reply['provider'],
                    'fallback' => $reply['fallback'],
                    'conversationId' => $reply['conversationId'] ?? $conversationId,
                    'suggestions' => [],
                ],
                'memory' => $memory,
            ]);
            break;

        // ── 偏好 ────────────────────────────────────────────────────────
        case 'preferences/list':
            shiguang_json(['preferences' => shiguang_preferences()]);
            break;

        case 'preferences/search':
            $query = trim((string)($_GET['query'] ?? $jsonInput['query'] ?? ''));
            shiguang_json(['query' => $query, 'results' => $query === '' ? [] : shiguang_search_preferences($query, 8)]);
            break;

        case 'preferences/upsert':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                shiguang_json(['error' => '请使用 POST 写入偏好。'], 405);
                break;
            }
            try {
                shiguang_json(['preference' => shiguang_upsert_preference($jsonInput)]);
            } catch (InvalidArgumentException $error) {
                shiguang_json(['error' => $error->getMessage()], 422);
            }
            break;

        case 'preferences/confirm':
            $id = trim((string)($jsonInput['id'] ?? $_GET['id'] ?? ''));
            $status = trim((string)($jsonInput['status'] ?? $_GET['status'] ?? 'confirmed'));
            if (!in_array($status, ['confirmed', 'pending', 'ignored'], true)) {
                $status = 'confirmed';
            }
            $preference = $id === '' ? null : shiguang_confirm_preference($id, $status);
            shiguang_json($preference ? ['preference' => $preference] : ['error' => '偏好不存在。'], $preference ? 200 : 404);
            break;

        case 'preferences/delete':
            $id = trim((string)($jsonInput['id'] ?? $_GET['id'] ?? ''));
            $deleted = $id !== '' && shiguang_delete_preference($id);
            shiguang_json($deleted ? ['ok' => true] : ['error' => '偏好不存在。'], $deleted ? 200 : 404);
            break;

        // ── 图片搜索 ────────────────────────────────────────────────────
        case 'media/search':
            $query = trim((string)($_GET['query'] ?? $jsonInput['query'] ?? 'travel'));
            $destinationId = trim((string)($_GET['destinationId'] ?? $jsonInput['destinationId'] ?? ''));
            $scene = trim((string)($_GET['scene'] ?? $jsonInput['scene'] ?? 'gallery'));
            $perPage = (int)($_GET['perPage'] ?? $jsonInput['perPage'] ?? 12);
            $destination = null;
            foreach ($bootstrap['destinations'] as $candidate) {
                if (($candidate['id'] ?? '') === $destinationId || ($candidate['name'] ?? '') === $query) {
                    $destination = $candidate;
                    break;
                }
            }
            $media = shiguang_media_search($query, $destination ?: [], $scene, $perPage);
            shiguang_json([
                'provider' => $media['provider'],
                'query' => $media['query'],
                'mode' => $media['mode'],
                'errors' => $media['errors'],
                'images' => $media['images'],
                'configured' => shiguang_public_settings()['unsplash']['configured']
                    || shiguang_public_settings()['media']['pexelsConfigured']
                    || shiguang_public_settings()['media']['pixabayConfigured']
                    || shiguang_public_settings()['media']['tencentWimgsConfigured'],
            ]);
            break;

        // ── 高德地图地理编码 ────────────────────────────────────────────
        case 'amap/geocode':
            $address = trim((string)($_GET['address'] ?? $jsonInput['address'] ?? ''));
            $city = trim((string)($_GET['city'] ?? $jsonInput['city'] ?? ''));
            if ($address === '') {
                shiguang_json(['error' => 'address 不能为空。'], 422);
                break;
            }
            shiguang_json(['provider' => '高德地图', 'result' => shiguang_amap_geocode($address, $city)]);
            break;

        // ── 系统设置（客户端配置读写）───────────────────────────────────
        case 'settings':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                shiguang_json(['ok' => true, 'settings' => shiguang_save_settings($jsonInput)]);
                break;
            }
            shiguang_json(['settings' => shiguang_settings(), 'publicSettings' => shiguang_public_settings()]);
            break;

        case 'check':
            shiguang_json(shiguang_diagnostic_check());
            break;

        default:
            shiguang_json(['error' => '接口不存在。', 'path' => $path], 404);
    }
} catch (Throwable $error) {
    shiguang_json(['error' => $error->getMessage()], 500);
}
