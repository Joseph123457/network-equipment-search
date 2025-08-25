-- admin123 비밀번호의 올바른 SHA-256 해시로 업데이트
-- Web Crypto API로 생성한 해시값: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
UPDATE admin_users 
SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' 
WHERE username = 'admin';