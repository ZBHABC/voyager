<?php
declare(strict_types=1);

require __DIR__ . '/data.php';

$bootstrap = shiguang_bootstrap();
$bootstrapJson = json_encode($bootstrap, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="拾光旅图 — AI 旅行助手，Dify 智能体驱动，覆盖地图探索、AI 顾问、行程规划和偏好记忆。" />
    <title>拾光旅图 / Shiguang Travel Vision</title>
    <link rel="stylesheet" href="styles.css?v=13" />
  </head>
  <body>
    <noscript>请启用 JavaScript 以体验拾光旅图的交互地图、AI 顾问和后台管理。</noscript>
    <div id="app"></div>
    <script>
      window.SHIGUANG_BOOTSTRAP = <?= $bootstrapJson ?: '{}' ?>;
    </script>
    <script src="app.js?v=13"></script>
  </body>
</html>
