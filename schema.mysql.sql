-- ============================================================
-- 拾光旅图 MySQL Schema
-- 数据库: shiguang_travel
-- 字符集: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS shiguang_travel
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE shiguang_travel;

-- ── 应用设置 ─────────────────────────────────────────────────
-- 存储 integrations（地图 Key / Dify / Unsplash 等配置）
-- 对应 JSON 文件: storage/integrations.json
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key   VARCHAR(80)  PRIMARY KEY,
  setting_value JSON         NOT NULL,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 偏好向量 ─────────────────────────────────────────────────
-- 存储用户偏好（likes / avoids / 对话提取的偏好）
-- 对应 JSON 文件: storage/preference_vectors.json
CREATE TABLE IF NOT EXISTS preference_vectors (
  id          VARCHAR(64)   PRIMARY KEY,
  user_id     VARCHAR(64)   NOT NULL DEFAULT 'demo',
  type        VARCHAR(32)   NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  detail      TEXT          NOT NULL,
  source      VARCHAR(32)   NOT NULL DEFAULT 'manual',
  status      VARCHAR(32)   NOT NULL DEFAULT 'pending',
  confidence  DECIMAL(5,4)  NOT NULL DEFAULT 0.7000,
  weight      DECIMAL(5,4)  NOT NULL DEFAULT 0.7200,
  tags_json   JSON          NOT NULL,
  vector_json JSON          NOT NULL,
  created_at  DATETIME      NOT NULL,
  updated_at  DATETIME      NOT NULL,
  INDEX idx_preference_user_status (user_id, status),
  INDEX idx_preference_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
