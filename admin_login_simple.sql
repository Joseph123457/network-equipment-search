-- 개인 PC용 간단한 관리자 계정 (평문 비밀번호)
-- 보안이 중요하지 않은 로컬 환경에서만 사용

-- 기존 관리자 계정 삭제
DELETE FROM admin_users WHERE username = 'admin';

-- 새로운 간단한 관리자 계정 생성 (비밀번호: admin)
INSERT INTO admin_users (username, password_hash, email) VALUES 
('admin', 'admin', 'admin@localhost.com');