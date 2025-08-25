# 🏠 개인 PC 설치 및 운영 가이드

## 📋 필수 소프트웨어

### Windows 사용자
1. **Node.js 설치** (v18 이상)
   - https://nodejs.org/ko/download/ 에서 LTS 버전 다운로드
   - 설치 시 "Add to PATH" 옵션 체크

2. **Git 설치**
   - https://git-scm.com/download/win 에서 다운로드
   - 설치 시 기본 옵션으로 설치

3. **VS Code 설치** (선택사항)
   - https://code.visualstudio.com/ 에서 다운로드
   - 코드 편집용 (메모장으로도 가능)

### Mac 사용자
```bash
# Homebrew로 설치 (터미널에서 실행)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
brew install git
```

### Linux 사용자
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm git

# CentOS/RHEL
sudo yum install nodejs npm git
```

## 📥 프로젝트 다운로드 및 설치

### 방법 1: GitHub에서 다운로드 (추천)
```bash
# 터미널/명령 프롬프트에서 실행
git clone https://github.com/사용자명/webapp.git
cd webapp
npm install
```

### 방법 2: ZIP 파일 다운로드
1. GitHub 페이지에서 "Code" → "Download ZIP" 클릭
2. 압축 해제 후 폴더로 이동
3. 터미널에서 `npm install` 실행

## 🚀 로컬 서버 실행

### 개발 모드 실행
```bash
# 프로젝트 폴더에서 실행
npm run build          # 프로젝트 빌드
npm run db:migrate:local   # 데이터베이스 초기화
npm run db:seed           # 샘플 데이터 입력

# 개발 서버 시작 (두 가지 방법 중 선택)
# 방법 1: Vite 개발 서버 (빠른 개발)
npm run dev

# 방법 2: Cloudflare Pages 환경 (실제 운영과 동일)
npm run dev:sandbox
```

### 접속 방법
- **로컬 주소**: http://localhost:3000
- **네트워크 주소**: http://본인IP:3000 (같은 네트워크의 다른 기기에서 접속)

## 🔧 실행 중 문제 해결

### 포트 충돌 문제
```bash
# 3000 포트가 사용 중인 경우
netstat -ano | findstr :3000    # Windows
lsof -ti:3000 | xargs kill -9   # Mac/Linux

# 또는 다른 포트 사용
PORT=3001 npm run dev
```

### 데이터베이스 초기화
```bash
# 데이터베이스 문제 시 완전 초기화
npm run db:reset
```

### 의존성 문제
```bash
# node_modules 폴더 삭제 후 재설치
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules & del package-lock.json  # Windows
npm install
```

## 📱 네트워크에서 접속하기

### Windows 방화벽 설정
1. 제어판 → 시스템 및 보안 → Windows Defender 방화벽
2. "고급 설정" 클릭
3. "인바운드 규칙" → "새 규칙" → "포트" 선택
4. TCP, 특정 로컬 포트 3000 입력
5. "연결 허용" 선택하고 완료

### IP 주소 확인
```bash
# Windows
ipconfig

# Mac/Linux  
ifconfig
ip addr show
```

### 같은 네트워크의 다른 기기에서 접속
- 스마트폰, 태블릿: http://192.168.1.100:3000 (예시 IP)
- 다른 PC: http://192.168.1.100:3000

## 🔄 자동 시작 설정

### Windows 서비스로 등록
1. **NSSM** (Non-Sucking Service Manager) 설치
   - https://nssm.cc/download 에서 다운로드
2. 관리자 권한으로 명령 프롬프트 실행
```cmd
nssm install "WebApp Service"
# Application path: C:\path\to\node.exe
# Startup directory: C:\path\to\webapp
# Arguments: npm run dev:sandbox
```

### Linux Systemd 서비스
```bash
# /etc/systemd/system/webapp.service 파일 생성
sudo nano /etc/systemd/system/webapp.service
```

```ini
[Unit]
Description=Network Equipment Search Website
After=network.target

[Service]
Type=simple
User=webapp
WorkingDirectory=/home/webapp/webapp
ExecStart=/usr/bin/npm run dev:sandbox
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 활성화
sudo systemctl enable webapp
sudo systemctl start webapp
sudo systemctl status webapp
```

## 📊 로그 및 모니터링

### 로그 확인
```bash
# 실시간 로그 보기
npm run logs

# PM2 사용 시
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs webapp
pm2 monit  # 실시간 모니터링
```

### 성능 모니터링
- **CPU/메모리 사용량**: 작업 관리자 또는 htop
- **접속자 수**: 애플리케이션 로그에서 확인
- **데이터베이스 크기**: SQLite 파일 크기 확인

## 💾 백업 및 복원

### 정기 백업
```bash
# 전체 프로젝트 백업
tar -czf webapp_backup_$(date +%Y%m%d).tar.gz webapp/

# 데이터베이스만 백업
cp .wrangler/state/v3/d1/webapp-production.sqlite3 backup/
```

### 복원
```bash
# 프로젝트 복원
tar -xzf webapp_backup_20241224.tar.gz

# 데이터베이스 복원
cp backup/webapp-production.sqlite3 .wrangler/state/v3/d1/
```

## 🔒 보안 권장사항

### 관리자 계정 변경
1. `/admin` 페이지 접속
2. 기본 계정(admin/admin123) 로그인
3. 새로운 관리자 계정 생성
4. 기본 계정 삭제 또는 비활성화

### 네트워크 보안
- **방화벽**: 필요한 포트만 열기
- **HTTPS**: 인증서 설치 (Let's Encrypt 등)
- **접속 제한**: IP 화이트리스트 설정

### 정기 업데이트
```bash
# 주기적으로 의존성 업데이트
npm audit
npm update
```