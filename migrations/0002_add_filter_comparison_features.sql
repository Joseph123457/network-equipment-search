-- 필터링 및 비교 기능을 위한 추가 컬럼들

-- 장비 테이블에 새로운 컬럼 추가
ALTER TABLE equipment ADD COLUMN min_price INTEGER; -- 최소 가격 (원)
ALTER TABLE equipment ADD COLUMN max_price INTEGER; -- 최대 가격 (원)
ALTER TABLE equipment ADD COLUMN release_date TEXT; -- 출시일 (YYYY-MM-DD)
ALTER TABLE equipment ADD COLUMN popularity_score INTEGER DEFAULT 0; -- 인기도 점수
ALTER TABLE equipment ADD COLUMN view_count INTEGER DEFAULT 0; -- 조회수
ALTER TABLE equipment ADD COLUMN comparison_count INTEGER DEFAULT 0; -- 비교 횟수
ALTER TABLE equipment ADD COLUMN status TEXT DEFAULT 'active'; -- 상태 (active, discontinued)

-- 필터링을 위한 사양 테이블 생성
CREATE TABLE IF NOT EXISTS equipment_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  spec_name TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  spec_unit TEXT,
  is_comparable BOOLEAN DEFAULT 1, -- 비교 가능한 스펙인지
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- 비교 히스토리 테이블
CREATE TABLE IF NOT EXISTS comparison_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_ids TEXT NOT NULL, -- JSON 배열 형태로 저장
  comparison_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

-- 브랜드별 통계를 위한 뷰
CREATE VIEW IF NOT EXISTS brand_stats AS
SELECT 
  brand,
  COUNT(*) as equipment_count,
  AVG(min_price) as avg_min_price,
  AVG(max_price) as avg_max_price,
  MAX(view_count) as max_views
FROM equipment 
WHERE status = 'active'
GROUP BY brand;

-- 카테고리별 통계를 위한 뷰
CREATE VIEW IF NOT EXISTS category_stats AS
SELECT 
  category,
  COUNT(*) as equipment_count,
  AVG(min_price) as avg_min_price,
  AVG(max_price) as avg_max_price,
  SUM(view_count) as total_views
FROM equipment 
WHERE status = 'active'
GROUP BY category;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_equipment_min_price ON equipment(min_price);
CREATE INDEX IF NOT EXISTS idx_equipment_max_price ON equipment(max_price);
CREATE INDEX IF NOT EXISTS idx_equipment_popularity ON equipment(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_release_date ON equipment(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_specs_equipment_id ON equipment_specs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_specs_name ON equipment_specs(spec_name);
CREATE INDEX IF NOT EXISTS idx_specs_comparable ON equipment_specs(is_comparable);