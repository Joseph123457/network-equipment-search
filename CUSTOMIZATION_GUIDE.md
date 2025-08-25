# 🎨 홈페이지 커스터마이징 가이드

## 🏷️ 사이트 이름 변경

### 1. 기본 사이트 제목 변경
**파일**: `src/renderer.tsx`
```typescript
// 현재
<title>네트워크 장비 정보 검색</title>

// 변경 예시
<title>IT 장비 쇼핑몰</title>
<title>서버 장비 전문몰</title>
<title>보안 솔루션 비교 사이트</title>
```

### 2. 헤더 로고/제목 변경
**파일**: `src/index.tsx` (모든 페이지의 헤더 부분)
```typescript
// 현재
<h1 className="text-2xl font-bold text-gray-900">네트워크 장비 정보</h1>

// 변경 예시
<h1 className="text-2xl font-bold text-gray-900">IT장비몰</h1>
<h1 className="text-2xl font-bold text-gray-900">
  <i className="fas fa-laptop mr-2"></i>
  테크샵
</h1>
```

### 3. 메타 정보 변경
**파일**: `src/renderer.tsx`
```typescript
// 현재
<meta name="description" content="네트워크, 보안, 서버 장비 정보를 빠르게 검색하고 확인할 수 있는 사이트입니다." />
<meta name="keywords" content="네트워크장비, 보안장비, 서버, 방화벽, 스위치, 라우터, 장비검색" />

// 변경 예시
<meta name="description" content="최신 IT 장비를 비교하고 구매할 수 있는 전문 쇼핑몰입니다." />
<meta name="keywords" content="IT장비, 컴퓨터, 노트북, 서버, 네트워크, 쇼핑몰" />
```

## 🎨 디자인 테마 변경

### 1. 색상 테마 변경
**파일**: `public/static/style.css`
```css
/* 현재 파란색 테마를 다른 색상으로 변경 */

/* 초록색 테마 */
.bg-blue-600 { background-color: #16a34a !important; }
.text-blue-600 { color: #16a34a !important; }
.border-blue-500 { border-color: #22c55e !important; }

/* 빨간색 테마 */
.bg-blue-600 { background-color: #dc2626 !important; }
.text-blue-600 { color: #dc2626 !important; }
.border-blue-500 { border-color: #ef4444 !important; }

/* 보라색 테마 */
.bg-blue-600 { background-color: #7c3aed !important; }
.text-blue-600 { color: #7c3aed !important; }
.border-blue-500 { border-color: #8b5cf6 !important; }
```

### 2. 로고 이미지 추가
**파일**: `public/static/logo.png` (이미지 파일 추가)
**수정**: `src/index.tsx`
```typescript
// 텍스트 로고를 이미지로 변경
<img src="/static/logo.png" alt="사이트명" className="h-8 w-auto" />
```

### 3. 배경 이미지 추가
**파일**: `public/static/style.css`
```css
/* 홈페이지 배경 이미지 */
.bg-gray-50 {
  background-image: url('/static/background.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

/* 반투명 오버레이 */
.content-overlay {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
}
```

## 📋 메뉴 구성 변경

### 1. 네비게이션 메뉴 수정
**파일**: `src/index.tsx` (모든 페이지의 nav 부분)
```typescript
// 현재 메뉴
<nav className="flex space-x-8">
  <a href="/" className="text-gray-900">홈</a>
  <a href="/list" className="text-gray-500">장비목록</a>
  <a href="/compare" className="text-gray-500">비교하기</a>
  <a href="/admin" className="text-gray-500">관리자</a>
</nav>

// 변경 예시 - 쇼핑몰 스타일
<nav className="flex space-x-8">
  <a href="/" className="text-gray-900">홈</a>
  <a href="/list?category=노트북" className="text-gray-500">노트북</a>
  <a href="/list?category=데스크톱" className="text-gray-500">데스크톱</a>
  <a href="/list?category=서버" className="text-gray-500">서버</a>
  <a href="/compare" className="text-gray-500">비교</a>
  <a href="/cart" className="text-gray-500">장바구니</a>
  <a href="/admin" className="text-gray-500">관리</a>
</nav>
```

### 2. 드롭다운 메뉴 추가
**파일**: `public/static/app.js`
```javascript
// 드롭다운 메뉴 토글 함수 추가
function toggleDropdown(id) {
  const dropdown = document.getElementById(id);
  dropdown.classList.toggle('hidden');
}
```

## 🏪 카테고리 변경

### 1. 기본 카테고리 수정
**파일**: `seed.sql`과 `seed_extended.sql`
```sql
-- 현재 카테고리: 보안, 네트워크, 서버
-- 새로운 카테고리로 변경

UPDATE equipment SET category = '노트북' WHERE category = '네트워크';
UPDATE equipment SET category = '데스크톱' WHERE category = '보안';
UPDATE equipment SET category = '모니터' WHERE category = '서버';
```

### 2. 홈페이지 카테고리 카드 수정
**파일**: `src/index.tsx`
```typescript
// 현재
<div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onclick="goToList('보안')">
  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
    <i className="fas fa-shield-alt text-red-600"></i>
  </div>
  <h3>보안 장비</h3>
  <p>방화벽, IPS, UTM 등</p>
</div>

// 변경 예시
<div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onclick="goToList('노트북')">
  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
    <i className="fas fa-laptop text-blue-600"></i>
  </div>
  <h3>노트북</h3>
  <p>게이밍, 업무용, 울트라북</p>
</div>
```

## 🛍️ 기능 추가/수정

### 1. 장바구니 기능 추가
**새 파일**: `src/cart.tsx`
```typescript
// 장바구니 페이지 구현
app.get('/cart', (c) => {
  return c.render(
    <div>
      <h2>장바구니</h2>
      <div id="cartItems"></div>
      <button onclick="checkout()">결제하기</button>
    </div>
  )
})
```

**파일**: `public/static/app.js`
```javascript
// 장바구니 기능 추가
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function addToCart(equipmentId) {
  cart.push(equipmentId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showMessage('장바구니에 추가되었습니다.');
}

function updateCartCount() {
  document.getElementById('cartCount').textContent = cart.length;
}
```

### 2. 가격 표시 기능 수정
**파일**: `public/static/app.js`
```javascript
// 현재: formatPrice 함수 수정
function formatPrice(price) {
  if (!price || price === 0) return '문의';
  
  // 쇼핑몰 스타일 가격 표시
  return '₩' + price.toLocaleString();
}
```

### 3. 리뷰/평점 기능 추가
**파일**: `migrations/0003_add_reviews.sql`
```sql
-- 리뷰 테이블 추가
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);
```

## 📱 모바일 대응 개선

### 1. 반응형 메뉴
**파일**: `src/index.tsx`
```typescript
// 모바일 햄버거 메뉴 추가
<div className="md:hidden">
  <button onclick="toggleMobileMenu()" className="text-gray-500 hover:text-gray-600">
    <i className="fas fa-bars text-xl"></i>
  </button>
</div>

<div id="mobileMenu" className="hidden md:hidden">
  <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
    <a href="/" className="block px-3 py-2 text-base font-medium">홈</a>
    <a href="/list" className="block px-3 py-2 text-base font-medium">목록</a>
  </div>
</div>
```

### 2. 터치 제스처 추가
**파일**: `public/static/app.js`
```javascript
// 스와이프 제스처로 이미지 갤러리 조작
let touchStartX = 0;
let touchEndX = 0;

function handleGesture() {
  if (touchEndX < touchStartX - 50) {
    nextImage(); // 왼쪽 스와이프
  }
  if (touchEndX > touchStartX + 50) {
    prevImage(); // 오른쪽 스와이프
  }
}

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleGesture();
});
```

## 🔧 실시간 수정 및 테스트

### 1. 개발 모드에서 실시간 확인
```bash
# 개발 서버 실행 (파일 변경 시 자동 새로고침)
npm run dev

# 브라우저에서 http://localhost:3000 접속
# 파일 수정 후 저장하면 자동���로 반영됨
```

### 2. 단계별 수정 프로세스
1. **파일 수정** → 저장
2. **브라우저 새로고침** → 변경사항 확인
3. **문제 없으면** → Git 커밋
4. **문제 있으면** → 수정 후 반복

### 3. 변경사항 백업
```bash
# 수정 전 백업
git add .
git commit -m "수정 전 백업"

# 수정 후 커밋
git add .
git commit -m "사이트명을 'IT장비몰'로 변경"

# 문제 시 되돌리기
git revert HEAD
```

## 📊 고급 커스터마이징

### 1. 다국어 지원
**새 파일**: `src/i18n.ts`
```typescript
const messages = {
  ko: {
    title: '네트워크 장비 정보',
    search: '검색',
    compare: '비교하기'
  },
  en: {
    title: 'Network Equipment Info',
    search: 'Search',
    compare: 'Compare'
  }
}
```

### 2. 테마 전환 기능
**파일**: `public/static/app.js`
```javascript
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('dark-theme');
  localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// 페이지 로드 시 저장된 테마 적용
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
});
```

### 3. 검색 기능 확장
**파일**: `public/static/app.js`
```javascript
// 음성 검색 기능 추가
function startVoiceSearch() {
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.onresult = function(event) {
      const searchInput = document.getElementById('searchInput');
      searchInput.value = event.results[0][0].transcript;
      performSearch(searchInput.value);
    };
    recognition.start();
  }
}
```

## 🚀 변경사항 적용하기

### 로컬 환경에서 테스트
```bash
# 1. 파일 수정
# 2. 서버 재시작
npm run build
pm2 restart webapp  # 또는 npm run dev

# 3. 브라우저에서 확인
```

### 온라인 환경에 반영
```bash
# Git에 변경사항 푸시
git add .
git commit -m "사이트 커스터마이징: 제목 변경 및 디자인 수정"
git push origin main

# Cloudflare Pages는 자동으로 배포됨
# 다른 플랫폼은 수동 배포 필요
```

이제 원하는 대로 사이트를 자유롭게 커스터마이징할 수 있습니다! 🎨