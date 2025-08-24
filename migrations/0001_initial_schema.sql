-- 네트워크/보안 장비 정보 테이블
CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                    -- 장비명
  category TEXT NOT NULL,                -- 카테고리 (네트워크, 보안, 서버 등)
  brand TEXT NOT NULL,                   -- 브랜드/제조사
  model TEXT NOT NULL,                   -- 모델명
  description TEXT,                      -- 장비 설명
  image_url TEXT,                        -- 장비 이미지 URL
  specifications JSON,                   -- 스펙 정보 (JSON 형태)
  certifications JSON,                   -- 인증 현황 (JSON 형태)
  price_range TEXT,                      -- 가격대
  tags TEXT,                            -- 검색용 태그 (콤마로 구분)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 검색 로그 테이블 (통계용)
CREATE TABLE IF NOT EXISTS search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_term TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(name);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_brand ON equipment(brand);
CREATE INDEX IF NOT EXISTS idx_equipment_model ON equipment(model);
CREATE INDEX IF NOT EXISTS idx_equipment_tags ON equipment(tags);
CREATE INDEX IF NOT EXISTS idx_search_logs_term ON search_logs(search_term);