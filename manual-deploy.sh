#!/bin/bash

echo "=== Cloudflare Pages 수동 배포 스크립트 ==="
echo "1. Cloudflare API 토큰이 필요합니다"
echo "2. https://dash.cloudflare.com/profile/api-tokens 에서 생성"
echo "3. Template: 'Custom Token'"
echo "4. Permissions: Account:Cloudflare Pages:Edit, Zone:Zone:Read, Zone:Page Rules:Edit"
echo ""

# API 토큰 입력 받기
read -s -p "Cloudflare API Token을 입력하세요: " CF_API_TOKEN
echo ""

# 환경 변수 설정
export CLOUDFLARE_API_TOKEN=$CF_API_TOKEN

# 배포 명령어들
echo "🔧 빌드 중..."
npm run build

echo "📡 Cloudflare Pages에 배포 중..."
npx wrangler pages deploy dist --project-name network-equipment-search

echo "✅ 배포 완료!"
echo "🌍 웹사이트 URL: https://network-equipment-search.pages.dev"