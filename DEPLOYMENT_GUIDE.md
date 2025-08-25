# 🚀 온라인 배포 가이드

## 배포 옵션 비교

| 플랫폼 | 비용 | 난이도 | 성능 | 추천도 |
|--------|------|--------|------|--------|
| **Cloudflare Pages** | 무료 | ⭐⭐ | ⭐⭐⭐⭐⭐ | 🏆 **강력추천** |
| **Vercel** | 무료 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Netlify** | 무료 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **AWS/Google Cloud** | 유료 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **개인 서버 (VPS)** | 월 5-20$ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🏆 방법 1: Cloudflare Pages (추천)

### 장점
- ✅ **완전 무료** (월 방문자 10만명까지)
- ✅ **전세계 CDN** (빠른 속도)
- ✅ **자동 HTTPS** 인증서
- ✅ **D1 데이터베이스** 무료 제공
- ✅ **Git 연동** 자동 배포

### 배포 단계

#### 1단계: Cloudflare 계정 생성
1. https://dash.cloudflare.com 회원가입
2. 이메일 인증 완료

#### 2단계: GitHub 저장소 준비
```bash
# 로컬에서 GitHub에 코드 업로드
git remote add origin https://github.com/사용자명/webapp.git
git push -u origin main
```

#### 3단계: Cloudflare Pages 프로젝트 생성
1. Cloudflare 대시보드 → "Pages" 메뉴
2. "Create a project" → "Connect to Git"
3. GitHub 저장소 선택
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment variables**: 필요시 추가

#### 4단계: D1 데이터베이스 설정
```bash
# Cloudflare CLI 설치
npm install -g wrangler

# Cloudflare 로그인
wrangler login

# D1 데이터베이스 생성
wrangler d1 create webapp-production

# 마이그레이션 적용
wrangler d1 migrations apply webapp-production

# 시드 데이터 삽입
wrangler d1 execute webapp-production --file=./seed.sql
wrangler d1 execute webapp-production --file=./seed_extended.sql
```

#### 5단계: 도메인 설정 (선택사항)
```bash
# 커스텀 도메인 연결
wrangler pages domain add example.com --project-name webapp
```

### 배포 후 확인 사항
- ✅ 홈페이지 정상 접속
- ✅ 검색 기능 동작
- ✅ 장비 비교 기능 동작
- ✅ 관리자 페이지 접속
- ✅ 데이터베이스 연결 확인

## 🔥 방법 2: Vercel (간단함)

### 배포 단계
1. https://vercel.com 회원가입
2. GitHub 저장소 연결
3. 프로젝트 import
4. 자동 배포 완료

### 주의사항
- D1 데이터베이스 대신 다른 DB 사용 필요
- SQLite → PostgreSQL/MySQL 마이그레이션 필요

## 💻 방법 3: 개인 서버 (VPS)

### 추천 서비스
- **DigitalOcean**: 월 $5 (기본 스펙)
- **Linode**: 월 $5 (안정적)
- **Vultr**: 월 $3.5 (저렴함)
- **AWS EC2**: 1년 무료 (복잡함)

### 서버 설정
```bash
# Ubuntu 서버 기본 설정
sudo apt update && sudo apt upgrade -y
sudo apt install nginx nodejs npm git pm2 -y

# 프로젝트 복사
git clone https://github.com/사용자명/webapp.git
cd webapp
npm install
npm run build

# PM2로 서비스 시작
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Nginx 설정
sudo nano /etc/nginx/sites-available/webapp
```

### Nginx 설정 파일
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 데이터 마이그레이션

### 로컬 → 클라우드 데이터 이전
```bash
# 로컬 SQLite 데이터 내보내기
sqlite3 .wrangler/state/v3/d1/webapp-production.sqlite3 .dump > data_export.sql

# Cloudflare D1에 데이터 가져오기
wrangler d1 execute webapp-production --file=data_export.sql
```

### 데이터베이스 변경 (SQLite → PostgreSQL)
```bash
# PostgreSQL 덤프 생성
pg_dump -h localhost -U username dbname > postgres_export.sql

# 새 환경에서 복원
psql -h new-host -U username -d dbname < postgres_export.sql
```

## 🌍 도메인 및 DNS 설정

### 도메인 구매
- **Cloudflare Registrar**: 저렴하고 쉬움
- **Namecheap**: 저렴함
- **GoDaddy**: 유명함

### DNS 설정
```
# A 레코드 (서버 IP 직접 연결)
@ A 서버IP주소

# CNAME 레코드 (다른 도메인으로 리다이렉트)
www CNAME webapp.pages.dev
```

## 🔒 HTTPS 인증서

### 무료 SSL 인증서
```bash
# Let's Encrypt 설치
sudo apt install certbot python3-certbot-nginx

# 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 다음 줄 추가: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 모니터링 및 관리

### 로그 모니터링
```bash
# PM2 로그
pm2 logs webapp

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 시스템 로그
sudo journalctl -u webapp -f
```

### 성능 모니터링
- **UptimeRobot**: 서비스 상태 모니터링
- **Google Analytics**: 방문자 분석
- **Cloudflare Analytics**: 트래픽 분석

## 💰 비용 예상

### 무료 옵션
- **Cloudflare Pages**: 완전 무료 (월 10만 방문자)
- **Vercel**: 무료 (월 100GB 트래픽)
- **Netlify**: 무료 (월 100GB 트래픽)

### 유료 옵션
- **VPS 서버**: 월 $5-20
- **도메인**: 연 $10-15
- **SSL 인증서**: 무료 (Let's Encrypt)

## 🚨 주의사항

### 보안
- ✅ 관리자 비밀번호 변경
- ✅ 불필요한 포트 차단
- ✅ 정기적인 백업
- ✅ 소프트웨어 업데이트

### 성능
- ✅ CDN 사용 (이미지, CSS, JS)
- ✅ 데이터베이스 최적화
- ✅ 캐싱 설정
- ✅ 압축 활성화

### 법적 고려사항
- ✅ 개인정보 처리방침
- ✅ 이용약관
- ✅ 쿠키 정책
- ✅ GDPR 준수 (EU 사용자 대상 시)