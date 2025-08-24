// 네트워크 장비 검색 웹사이트 JavaScript

// 전역 변수
let currentUser = null;
let searchTimeout = null;
let currentFilters = {
  query: '',
  category: '',
  brand: '',
  minPrice: 0,
  maxPrice: 0,
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1
};
let selectedForComparison = [];
let availableFilters = null;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // 홈페이지 초기화
  if (document.getElementById('searchInput') && window.location.pathname === '/') {
    initializeHomePage();
  }
  
  // 장비 목록 페이지 초기화
  if (document.getElementById('equipmentList')) {
    initializeListPage();
  }
  
  // 비교 페이지 초기화
  if (window.location.pathname === '/compare') {
    loadComparisonFromURL();
  }
  
  // 관리자 페이지 초기화
  if (document.getElementById('adminLoginForm')) {
    initializeAdmin();
  }
  
  // 장비 상세 페이지 초기화
  if (document.getElementById('equipmentDetail')) {
    // Equipment detail will be loaded by specific function call
  }
}

// 홈페이지 초기화
function initializeHomePage() {
  initializeSearch();
  loadPopularEquipment();
}

// 장비 목록 페이지 초기화
function initializeListPage() {
  loadFilters();
  initializeFilterEvents();
  loadEquipmentList();
}

// 필터 로드
async function loadFilters() {
  try {
    const response = await fetch('/api/filters');
    availableFilters = await response.json();
    
    populateFilterOptions();
  } catch (error) {
    console.error('Load filters error:', error);
  }
}

// 필터 옵션 채우기
function populateFilterOptions() {
  if (!availableFilters) return;
  
  // 카테고리 필터
  const categoryFilters = document.getElementById('categoryFilters');
  if (categoryFilters) {
    categoryFilters.innerHTML = availableFilters.categories.map(cat => `
      <label class="flex items-center">
        <input type="radio" name="category" value="${cat.category}" class="mr-2">
        <span class="text-sm">${cat.category} (${cat.count})</span>
      </label>
    `).join('');
    
    // 전체 옵션 추가
    categoryFilters.insertAdjacentHTML('afterbegin', `
      <label class="flex items-center">
        <input type="radio" name="category" value="" class="mr-2" checked>
        <span class="text-sm">전체</span>
      </label>
    `);
  }
  
  // 브랜드 필터
  const brandFilters = document.getElementById('brandFilters');
  if (brandFilters) {
    brandFilters.innerHTML = availableFilters.brands.map(brand => `
      <label class="flex items-center">
        <input type="checkbox" name="brand" value="${brand.brand}" class="mr-2">
        <span class="text-sm">${brand.brand} (${brand.count})</span>
      </label>
    `).join('');
  }
  
  // 가격 범위 설정
  if (availableFilters.priceRange) {
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    if (minPriceInput && maxPriceInput) {
      minPriceInput.placeholder = `최소: ${formatPrice(availableFilters.priceRange.min_price)}`;
      maxPriceInput.placeholder = `최대: ${formatPrice(availableFilters.priceRange.max_price)}`;
    }
  }
}

// 필터 이벤트 초기화
function initializeFilterEvents() {
  // 필터 적용 버튼
  document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
  
  // 필터 초기화 버튼
  document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
  
  // 정렬 변경
  document.getElementById('sortSelect')?.addEventListener('change', function() {
    const [sortBy, sortOrder] = this.value.split('-');
    currentFilters.sortBy = sortBy;
    currentFilters.sortOrder = sortOrder;
    currentFilters.page = 1;
    loadEquipmentList();
  });
  
  // 비교 버튼
  document.getElementById('compareBtn')?.addEventListener('click', compareSelectedEquipment);
  
  // 필터 검색
  document.getElementById('filterSearch')?.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.query = this.value;
      currentFilters.page = 1;
      loadEquipmentList();
    }, 300);
  });
}

// 필터 적용
function applyFilters() {
  // 카테고리
  const selectedCategory = document.querySelector('input[name="category"]:checked');
  currentFilters.category = selectedCategory ? selectedCategory.value : '';
  
  // 브랜드 (다중 선택)
  const selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked'))
    .map(input => input.value);
  currentFilters.brand = selectedBrands.join(',');
  
  // 가격 범위
  currentFilters.minPrice = parseInt(document.getElementById('minPrice').value) || 0;
  currentFilters.maxPrice = parseInt(document.getElementById('maxPrice').value) || 999999999;
  
  currentFilters.page = 1;
  loadEquipmentList();
}

// 필터 초기화
function resetFilters() {
  currentFilters = {
    query: '',
    category: '',
    brand: '',
    minPrice: 0,
    maxPrice: 0,
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1
  };
  
  // UI 초기화
  document.getElementById('filterSearch').value = '';
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.getElementById('sortSelect').value = 'name-asc';
  
  document.querySelectorAll('input[name="category"]').forEach(input => {
    input.checked = input.value === '';
  });
  
  document.querySelectorAll('input[name="brand"]').forEach(input => {
    input.checked = false;
  });
  
  loadEquipmentList();
}

// 장비 목록 로드
async function loadEquipmentList() {
  const loading = document.getElementById('listLoading');
  const equipmentList = document.getElementById('equipmentList');
  
  loading?.classList.remove('hidden');
  
  try {
    const params = new URLSearchParams();
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value !== '' && value !== 0) {
        params.append(key, value);
      }
    });
    
    const response = await fetch(`/api/search?${params}`);
    const data = await response.json();
    
    loading?.classList.add('hidden');
    displayEquipmentList(data);
    updateResultCount(data.total);
    updatePagination(data);
    
  } catch (error) {
    loading?.classList.add('hidden');
    console.error('Load equipment list error:', error);
    showError('장비 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// 장비 목록 표시
function displayEquipmentList(data) {
  const equipmentList = document.getElementById('equipmentList');
  if (!equipmentList) return;
  
  if (!data.equipment || data.equipment.length === 0) {
    equipmentList.innerHTML = `
      <div class="text-center py-12 bg-white rounded-lg shadow">
        <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
        <p class="text-lg text-gray-600">검색 조건에 맞는 장비가 없습니다.</p>
        <p class="text-sm text-gray-500 mt-2">다른 조건으로 검색해보세요.</p>
      </div>
    `;
    return;
  }
  
  equipmentList.innerHTML = data.equipment.map(equipment => `
    <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div class="p-6">
        <div class="flex items-start gap-4">
          <!-- 비교 체크박스 -->
          <div class="flex-shrink-0 pt-2">
            <input 
              type="checkbox" 
              class="compare-checkbox w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
              data-equipment-id="${equipment.id}"
              ${selectedForComparison.includes(equipment.id) ? 'checked' : ''}
            >
          </div>
          
          <!-- 장비 이미지 -->
          <div class="flex-shrink-0">
            ${equipment.image_url ? 
              `<img src="${equipment.image_url}" alt="${equipment.name}" class="w-20 h-20 object-cover rounded-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` +
              `<div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center" style="display:none;"><i class="fas fa-cube text-gray-400 text-2xl"></i></div>`
              :
              `<div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center"><i class="fas fa-cube text-gray-400 text-2xl"></i></div>`
            }
          </div>
          
          <!-- 장비 정보 -->
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer" onclick="viewEquipment(${equipment.id})">
                  ${equipment.name}
                </h3>
                <p class="text-sm text-gray-600">${equipment.brand} ${equipment.model}</p>
                <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(equipment.category)} mt-1">
                  ${equipment.category}
                </span>
              </div>
              
              <div class="text-right">
                <div class="text-lg font-bold text-blue-600">
                  ${formatPrice(equipment.min_price)} ~ ${formatPrice(equipment.max_price)}
                </div>
                <div class="text-sm text-gray-500 mt-1">
                  <i class="fas fa-eye mr-1"></i>${equipment.view_count || 0}
                  <i class="fas fa-balance-scale ml-2 mr-1"></i>${equipment.comparison_count || 0}
                </div>
              </div>
            </div>
            
            <p class="text-sm text-gray-600 mt-2 line-clamp-2">${equipment.description || '설명이 없습니다.'}</p>
            
            <!-- 주요 스펙 미리보기 -->
            ${equipment.specifications ? displaySpecPreview(JSON.parse(equipment.specifications)) : ''}
            
            <div class="flex justify-between items-center mt-4">
              <div class="flex gap-2">
                ${equipment.tags ? equipment.tags.split(',').slice(0, 3).map(tag => 
                  `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded cursor-pointer hover:bg-gray-200" onclick="searchTag('${tag.trim()}')">${tag.trim()}</span>`
                ).join('') : ''}
              </div>
              
              <button 
                onclick="viewEquipment(${equipment.id})" 
                class="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                상세보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  // 비교 체크박스 이벤트 추가
  document.querySelectorAll('.compare-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', handleCompareCheckbox);
  });
}

// 스펙 미리보기 표시
function displaySpecPreview(specs) {
  const specEntries = Object.entries(specs).slice(0, 3);
  if (specEntries.length === 0) return '';
  
  return `
    <div class="mt-3 text-xs text-gray-500">
      <strong>주요 스펙:</strong> 
      ${specEntries.map(([key, value]) => `${key}: ${value}`).join(' | ')}
    </div>
  `;
}

// 비교 체크박스 처리
function handleCompareCheckbox(event) {
  const equipmentId = parseInt(event.target.dataset.equipmentId);
  
  if (event.target.checked) {
    if (selectedForComparison.length >= 4) {
      event.target.checked = false;
      showError('최대 4개까지만 비교할 수 있습니다.');
      return;
    }
    selectedForComparison.push(equipmentId);
  } else {
    selectedForComparison = selectedForComparison.filter(id => id !== equipmentId);
  }
  
  updateCompareButton();
}

// 비교 버튼 업데이트
function updateCompareButton() {
  const compareBtn = document.getElementById('compareBtn');
  const compareCount = document.getElementById('compareCount');
  
  if (compareCount) {
    compareCount.textContent = selectedForComparison.length;
  }
  
  if (compareBtn) {
    compareBtn.disabled = selectedForComparison.length < 2;
    compareBtn.textContent = selectedForComparison.length < 2 ? 
      '비교하기 (2개 이상 선택)' : 
      `비교하기 (${selectedForComparison.length}개)`;
  }
}

// 선택된 장비 비교
function compareSelectedEquipment() {
  if (selectedForComparison.length < 2) {
    showError('비교하려면 최소 2개의 장비를 선택해주세요.');
    return;
  }
  
  const compareUrl = `/compare?ids=${selectedForComparison.join(',')}`;
  window.location.href = compareUrl;
}

// URL에서 비교 로드
function loadComparisonFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const ids = urlParams.get('ids');
  
  if (ids) {
    const equipmentIds = ids.split(',').map(id => parseInt(id));
    loadComparison(equipmentIds);
  }
}

// 비교 로드
async function loadComparison(equipmentIds) {
  try {
    const response = await fetch('/api/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ equipmentIds })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    displayComparison(data);
  } catch (error) {
    console.error('Load comparison error:', error);
    document.getElementById('compareContent').innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">비교 실패</h2>
        <p class="text-gray-600 mb-4">${error.message}</p>
        <a href="/list" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <i class="fas fa-list mr-2"></i>
          장비 목록으로 돌아가기
        </a>
      </div>
    `;
  }
}

// 비교 표시
function displayComparison(data) {
  const compareContent = document.getElementById('compareContent');
  const equipment = data.equipment;
  const specs = data.specs;
  const allSpecs = data.allSpecs;
  
  let comparisonHtml = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">장비 비교</h2>
      <p class="text-gray-600">${equipment.length}개 장비의 상세 스펙을 비교해보세요.</p>
    </div>
    
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                항목
              </th>
              ${equipment.map(eq => `
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-2">
                      ${eq.image_url ? 
                        `<img src="${eq.image_url}" alt="${eq.name}" class="w-full h-full object-cover rounded" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` +
                        `<div class="w-full h-full bg-gray-200 rounded flex items-center justify-center" style="display:none;"><i class="fas fa-cube text-gray-400"></i></div>`
                        :
                        `<div class="w-full h-full bg-gray-200 rounded flex items-center justify-center"><i class="fas fa-cube text-gray-400"></i></div>`
                      }
                    </div>
                    <div class="font-semibold text-gray-900 text-sm">${eq.name}</div>
                    <div class="text-xs text-gray-600">${eq.brand} ${eq.model}</div>
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- 기본 정보 -->
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">카테고리</td>
              ${equipment.map(eq => `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(eq.category)}">${eq.category}</span>
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">가격대</td>
              ${equipment.map(eq => `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <div class="font-semibold text-blue-600">${formatPrice(eq.min_price)} ~ ${formatPrice(eq.max_price)}</div>
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">인기도</td>
              ${equipment.map(eq => `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <div class="flex items-center justify-center">
                    <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div class="bg-blue-600 h-2 rounded-full" style="width: ${eq.popularity_score}%"></div>
                    </div>
                    <span class="text-xs">${eq.popularity_score}</span>
                  </div>
                </td>
              `).join('')}
            </tr>
            
            ${allSpecs.map((specName, index) => `
              <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">${specName}</td>
                ${equipment.map(eq => {
                  const specData = specs[eq.id][specName];
                  return `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      ${specData ? `${specData.value}${specData.unit ? ' ' + specData.unit : ''}` : '-'}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
            
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">상세보기</td>
              ${equipment.map(eq => `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <button onclick="viewEquipment(${eq.id})" class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    상세보기
                  </button>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="mt-8 text-center">
      <a href="/list" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-4">
        <i class="fas fa-list mr-2"></i>
        장비 목록으로 돌아가기
      </a>
      <button onclick="window.print()" class="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700">
        <i class="fas fa-print mr-2"></i>
        비교표 인쇄
      </button>
    </div>
  `;
  
  compareContent.innerHTML = comparisonHtml;
}

// 인기 장비 로드
async function loadPopularEquipment() {
  try {
    const response = await fetch('/api/popular?limit=8');
    const data = await response.json();
    
    const popularDiv = document.getElementById('popularEquipment');
    if (!popularDiv || !data.equipment) return;
    
    popularDiv.innerHTML = data.equipment.map(eq => `
      <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" onclick="viewEquipment(${eq.id})">
        <div class="p-4">
          <div class="text-center">
            ${eq.image_url ? 
              `<img src="${eq.image_url}" alt="${eq.name}" class="w-16 h-16 mx-auto object-cover rounded-lg mb-2" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` +
              `<div class="w-16 h-16 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-2" style="display:none;"><i class="fas fa-cube text-gray-400"></i></div>`
              :
              `<div class="w-16 h-16 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-2"><i class="fas fa-cube text-gray-400"></i></div>`
            }
            <h4 class="text-sm font-semibold text-gray-900 mb-1">${eq.name}</h4>
            <p class="text-xs text-gray-600">${eq.brand}</p>
            <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(eq.category)} mt-1">${eq.category}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load popular equipment error:', error);
  }
}

// 결과 개수 업데이트
function updateResultCount(total) {
  const resultCount = document.getElementById('resultCount');
  if (resultCount) {
    resultCount.textContent = `검색 결과: ${total.toLocaleString()}개`;
  }
}

// 페이지네이션 업데이트
function updatePagination(data) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  
  const { page, totalPages } = data;
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let paginationHtml = '';
  
  // 이전 페이지
  if (page > 1) {
    paginationHtml += `
      <button onclick="changePage(${page - 1})" class="px-3 py-2 mx-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
        <i class="fas fa-chevron-left"></i>
      </button>
    `;
  }
  
  // 페이지 번호들
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    paginationHtml += `
      <button 
        onclick="changePage(${i})" 
        class="px-3 py-2 mx-1 ${i === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'} rounded-md"
      >
        ${i}
      </button>
    `;
  }
  
  // 다음 페이지
  if (page < totalPages) {
    paginationHtml += `
      <button onclick="changePage(${page + 1})" class="px-3 py-2 mx-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
  }
  
  pagination.innerHTML = paginationHtml;
}

// 페이지 변경
function changePage(page) {
  currentFilters.page = page;
  loadEquipmentList();
  window.scrollTo(0, 0);
}

// 가격 포맷팅
function formatPrice(price) {
  if (!price || price === 0) return '미정';
  
  if (price >= 10000000) {
    return Math.floor(price / 10000000) + '천만원';
  } else if (price >= 1000000) {
    return Math.floor(price / 1000000) + '백만원';
  } else if (price >= 10000) {
    return Math.floor(price / 10000) + '만원';
  } else {
    return price.toLocaleString() + '원';
  }
}

// 카테고리로 리스트 페이지 이동
function goToList(category) {
  window.location.href = `/list?category=${encodeURIComponent(category)}`;
}

// 홈페이지 빠른 검색에서 전체 결과 보기
function viewAllResults() {
  const query = document.getElementById('searchInput').value;
  window.location.href = `/list?q=${encodeURIComponent(query)}`;
}

// 검색 기능 초기화
function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (this.value.trim().length > 0) {
        performSearch(this.value.trim());
      } else {
        hideSearchResults();
      }
    }, 300);
  });
  
  searchBtn.addEventListener('click', function() {
    const query = searchInput.value.trim();
    if (query) {
      performSearch(query);
    }
  });
  
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = this.value.trim();
      if (query) {
        performSearch(query);
      }
    }
  });
}

// 검색 수행
async function performSearch(query) {
  showLoading();
  
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    hideLoading();
    displaySearchResults(data.equipment, query);
  } catch (error) {
    hideLoading();
    console.error('Search error:', error);
    showError('검색 중 오류가 발생했습니다.');
  }
}

// 카테고리 검색
function searchCategory(category) {
  document.getElementById('searchInput').value = category;
  performSearch(category);
}

// 빠른 검색 결과 표시 (홈페이지용)
function displaySearchResults(equipment, query) {
  const resultsDiv = document.getElementById('quickSearchResults');
  const resultsListDiv = document.getElementById('quickResultsList');
  const viewAllBtn = document.getElementById('viewAllResults');
  
  // 빠른 검색 결과가 없는 경우 (홈페이지에서는 간단히 처리)
  if (!equipment || equipment.length === 0) {
    resultsDiv.classList.add('hidden');
    return;
  }
  
  // 상위 6개만 표시 (빠른 검색)
  const limitedResults = equipment.slice(0, 6);
  
  let resultHtml = '';
  limitedResults.forEach(item => {
    resultHtml += `
      <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" onclick="viewEquipment(${item.id})">
        <div class="p-4">
          <div class="flex items-center mb-3">
            <div class="flex-shrink-0">
              ${item.image_url ? 
                `<img src="${item.image_url}" alt="${item.name}" class="w-12 h-12 object-cover rounded-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` +
                `<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center" style="display:none;"><i class="fas fa-cube text-gray-400"></i></div>`
                :
                `<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"><i class="fas fa-cube text-gray-400"></i></div>`
              }
            </div>
            <div class="ml-3 flex-1">
              <h4 class="text-sm font-semibold text-gray-900">${item.name}</h4>
              <p class="text-xs text-gray-600">${item.brand} ${item.model}</p>
              <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)} mt-1">${item.category}</span>
            </div>
          </div>
          
          <div class="text-sm font-medium text-blue-600">
            ${formatPrice(item.min_price)} ~ ${formatPrice(item.max_price)}
          </div>
        </div>
      </div>
    `;
  });
  
  resultsListDiv.innerHTML = resultHtml;
  
  // 전체 결과 보기 버튼 이벤트
  viewAllBtn.onclick = () => {
    window.location.href = `/list?q=${encodeURIComponent(query)}`;
  };
  
  resultsDiv.classList.remove('hidden');
}

// 카테고리별 색상 반환
function getCategoryColor(category) {
  const colors = {
    '보안': 'bg-red-100 text-red-800',
    '네트워크': 'bg-blue-100 text-blue-800',
    '서버': 'bg-green-100 text-green-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
}

// 장비 상세 보기
function viewEquipment(id) {
  window.location.href = `/equipment/${id}`;
}

// 장비 상세 정보 로드
async function loadEquipmentDetail(id) {
  const loadingDiv = document.getElementById('loading');
  const detailDiv = document.getElementById('equipmentDetail');
  
  try {
    const response = await fetch(`/api/equipment/${id}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const equipment = data.equipment;
    const specs = equipment.specifications ? JSON.parse(equipment.specifications) : {};
    const certs = equipment.certifications ? JSON.parse(equipment.certifications) : {};
    
    loadingDiv.classList.add('hidden');
    detailDiv.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="md:flex">
          <div class="md:w-1/3">
            ${equipment.image_url ? 
              `<img src="${equipment.image_url}" alt="${equipment.name}" class="w-full h-64 md:h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` +
              `<div class="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center" style="display:none;"><i class="fas fa-cube text-gray-400 text-6xl"></i></div>`
              :
              `<div class="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center"><i class="fas fa-cube text-gray-400 text-6xl"></i></div>`
            }
          </div>
          <div class="md:w-2/3 p-8">
            <div class="mb-6">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">${equipment.name}</h1>
              <p class="text-xl text-gray-600">${equipment.brand} ${equipment.model}</p>
              <span class="inline-block px-3 py-1 text-sm font-semibold rounded-full ${getCategoryColor(equipment.category)} mt-2">${equipment.category}</span>
            </div>
            
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">제품 설명</h3>
              <p class="text-gray-700 leading-relaxed">${equipment.description || '제품 설명이 없습니다.'}</p>
            </div>
            
            ${equipment.price_range ? `
              <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">가격대</h3>
                <p class="text-xl font-bold text-blue-600">${equipment.price_range}</p>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="px-8 py-6 bg-gray-50">
          <div class="grid md:grid-cols-2 gap-8">
            <!-- 기술 스펙 -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">기술 스펙</h3>
              ${Object.keys(specs).length > 0 ? `
                <div class="space-y-2">
                  ${Object.entries(specs).map(([key, value]) => `
                    <div class="flex justify-between py-2 border-b border-gray-200">
                      <span class="font-medium text-gray-700">${key}:</span>
                      <span class="text-gray-900">${value}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="text-gray-500">기술 스펙 정보가 없습니다.</p>'}
            </div>
            
            <!-- 인증 현황 -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">인증 현황</h3>
              ${Object.keys(certs).length > 0 ? `
                <div class="space-y-2">
                  ${Object.entries(certs).map(([key, value]) => `
                    <div class="flex items-center py-2">
                      <i class="fas fa-certificate text-green-500 mr-2"></i>
                      <span class="font-medium text-gray-700">${key}:</span>
                      <span class="ml-2 text-gray-900">${value}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="text-gray-500">인증 정보가 없습니다.</p>'}
            </div>
          </div>
          
          ${equipment.tags ? `
            <div class="mt-8">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">관련 키워드</h3>
              <div class="flex flex-wrap gap-2">
                ${equipment.tags.split(',').map(tag => `
                  <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full cursor-pointer hover:bg-blue-200" onclick="searchTag('${tag.trim()}')">${tag.trim()}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="mt-8 text-center">
        <a href="/" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <i class="fas fa-arrow-left mr-2"></i>
          검색으로 돌아가기
        </a>
      </div>
    `;
  } catch (error) {
    loadingDiv.classList.add('hidden');
    detailDiv.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">오류 발생</h2>
        <p class="text-gray-600 mb-4">${error.message}</p>
        <a href="/" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <i class="fas fa-arrow-left mr-2"></i>
          검색으로 돌아가기
        </a>
      </div>
    `;
  }
}

// 태그 검색
function searchTag(tag) {
  window.location.href = `/?q=${encodeURIComponent(tag)}`;
}

// 검색 결과 숨기기
function hideSearchResults() {
  document.getElementById('searchResults').classList.add('hidden');
}

// 로딩 표시
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

// 로딩 숨기기
function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

// 오류 메시지 표시
function showError(message) {
  alert(message); // 실제 운영에서는 더 나은 UI로 교체
}

// 관리자 기능 초기화
function initializeAdmin() {
  const loginForm = document.getElementById('adminLoginForm');
  
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        currentUser = data.admin;
        localStorage.setItem('adminToken', data.token);
        showAdminPanel();
      } else {
        showError('로그인 정보가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('로그인 중 오류가 발생했습니다.');
    }
  });
  
  // 저장된 토큰 확인
  const savedToken = localStorage.getItem('adminToken');
  if (savedToken) {
    showAdminPanel();
  }
}

// 관리자 패널 표시
function showAdminPanel() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  
  loadAdminEquipmentList();
  
  // 로그아웃 버튼 이벤트
  document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('adminToken');
    currentUser = null;
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
  });
  
  // 장비 추가 버튼 이벤트
  document.getElementById('addEquipmentBtn').addEventListener('click', function() {
    showEquipmentForm();
  });
}

// 관리자 장비 목록 로드
async function loadAdminEquipmentList() {
  try {
    const response = await fetch('/api/search?q=');
    const data = await response.json();
    
    const listDiv = document.getElementById('adminEquipmentList');
    
    if (data.equipment.length === 0) {
      listDiv.innerHTML = `
        <div class="p-8 text-center text-gray-500">
          <i class="fas fa-box-open text-4xl mb-4 opacity-50"></i>
          <p>등록된 장비가 없습니다.</p>
        </div>
      `;
      return;
    }
    
    let tableHtml = `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">장비명</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">브랜드</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">모델</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
    `;
    
    data.equipment.forEach(item => {
      tableHtml += `
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${item.name}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}">${item.category}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.brand}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.model}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
            <button onclick="editEquipment(${item.id})" class="text-blue-600 hover:text-blue-900">수정</button>
            <button onclick="deleteEquipment(${item.id})" class="text-red-600 hover:text-red-900">삭제</button>
          </td>
        </tr>
      `;
    });
    
    tableHtml += `
          </tbody>
        </table>
      </div>
    `;
    
    listDiv.innerHTML = tableHtml;
  } catch (error) {
    console.error('Load equipment list error:', error);
    showError('장비 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// 장비 폼 표시 (추가/수정)
function showEquipmentForm(equipment = null) {
  const isEdit = equipment !== null;
  const title = isEdit ? '장비 수정' : '장비 추가';
  
  const modalHtml = `
    <div id="equipmentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 text-center mb-4">${title}</h3>
          
          <form id="equipmentForm" class="space-y-4">
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">장비명 *</label>
                <input type="text" id="equipmentName" value="${equipment?.name || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
                <select id="equipmentCategory" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">선택하세요</option>
                  <option value="보안" ${equipment?.category === '보안' ? 'selected' : ''}>보안</option>
                  <option value="네트워크" ${equipment?.category === '네트워크' ? 'selected' : ''}>네트워크</option>
                  <option value="서버" ${equipment?.category === '서버' ? 'selected' : ''}>서버</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">브랜드 *</label>
                <input type="text" id="equipmentBrand" value="${equipment?.brand || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">모델명 *</label>
                <input type="text" id="equipmentModel" value="${equipment?.model || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea id="equipmentDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${equipment?.description || ''}</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
              <input type="url" id="equipmentImage" value="${equipment?.image_url || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">가격대</label>
              <input type="text" id="equipmentPrice" value="${equipment?.price_range || ''}" placeholder="예: 100만원-300만원" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">태그 (콤마로 구분)</label>
              <input type="text" id="equipmentTags" value="${equipment?.tags || ''}" placeholder="예: 방화벽,보안장비,엔터프라이즈" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">기술 스펙 (JSON 형식)</label>
              <textarea id="equipmentSpecs" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder='{"throughput": "1 Gbps", "ports": "24"}'>${equipment?.specifications || ''}</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">인증 현황 (JSON 형식)</label>
              <textarea id="equipmentCerts" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder='{"cc": "CC EAL4", "fips": "FIPS 140-2"}'>${equipment?.certifications || ''}</textarea>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" onclick="closeEquipmentModal()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">취소</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">${isEdit ? '수정' : '추가'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // 폼 제출 이벤트
  document.getElementById('equipmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('equipmentName').value,
      category: document.getElementById('equipmentCategory').value,
      brand: document.getElementById('equipmentBrand').value,
      model: document.getElementById('equipmentModel').value,
      description: document.getElementById('equipmentDescription').value,
      image_url: document.getElementById('equipmentImage').value,
      price_range: document.getElementById('equipmentPrice').value,
      tags: document.getElementById('equipmentTags').value,
      specifications: document.getElementById('equipmentSpecs').value,
      certifications: document.getElementById('equipmentCerts').value
    };
    
    try {
      const url = isEdit ? `/api/admin/equipment/${equipment.id}` : '/api/admin/equipment';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        closeEquipmentModal();
        loadAdminEquipmentList();
        showError(`장비가 성공적으로 ${isEdit ? '수정' : '추가'}되었습니다.`);
      } else {
        showError(result.error || `장비 ${isEdit ? '수정' : '추가'}에 실패했습니다.`);
      }
    } catch (error) {
      console.error('Equipment save error:', error);
      showError(`장비 ${isEdit ? '수정' : '추가'} 중 오류가 발생했습니다.`);
    }
  });
}

// 장비 수정
async function editEquipment(id) {
  try {
    const response = await fetch(`/api/equipment/${id}`);
    const data = await response.json();
    
    if (data.equipment) {
      showEquipmentForm(data.equipment);
    } else {
      showError('장비 정보를 불러올 수 없습니다.');
    }
  } catch (error) {
    console.error('Load equipment error:', error);
    showError('장비 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// 장비 삭제
async function deleteEquipment(id) {
  if (!confirm('정말로 이 장비를 삭제하시겠습니까?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/equipment/${id}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success) {
      loadAdminEquipmentList();
      showError('장비가 성공적으로 삭제되었습니다.');
    } else {
      showError('장비 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('Delete equipment error:', error);
    showError('장비 삭제 중 오류가 발생했습니다.');
  }
}

// 모달 닫기
function closeEquipmentModal() {
  const modal = document.getElementById('equipmentModal');
  if (modal) {
    modal.remove();
  }
}