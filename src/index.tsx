import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API endpoints
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './' }))

// Use renderer middleware
app.use(renderer)

// API Routes
// 고급 장비 검색 API (필터링, 정렬 지원)
app.get('/api/search', async (c) => {
  const { env } = c;
  const query = c.req.query('q') || '';
  const category = c.req.query('category') || '';
  const brand = c.req.query('brand') || '';
  const minPrice = parseInt(c.req.query('minPrice') || '0');
  const maxPrice = parseInt(c.req.query('maxPrice') || '999999999');
  const sortBy = c.req.query('sortBy') || 'name'; // name, price, popularity, newest
  const sortOrder = c.req.query('sortOrder') || 'asc'; // asc, desc
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    let whereConditions = ['status = ?'];
    let params = ['active'];
    
    // 검색어 조건
    if (query.trim()) {
      whereConditions.push(`(
        name LIKE ? OR 
        category LIKE ? OR 
        brand LIKE ? OR 
        model LIKE ? OR 
        description LIKE ? OR 
        tags LIKE ?
      )`);
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // 카테고리 필터
    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }
    
    // 브랜드 필터
    if (brand) {
      whereConditions.push('brand = ?');
      params.push(brand);
    }
    
    // 가격 범위 필터
    if (minPrice > 0) {
      whereConditions.push('min_price >= ?');
      params.push(minPrice);
    }
    if (maxPrice < 999999999) {
      whereConditions.push('max_price <= ?');
      params.push(maxPrice);
    }
    
    // 정렬 조건
    let orderClause = 'ORDER BY ';
    switch (sortBy) {
      case 'price':
        orderClause += `min_price ${sortOrder}`;
        break;
      case 'popularity':
        orderClause += `popularity_score ${sortOrder}`;
        break;
      case 'newest':
        orderClause += `release_date ${sortOrder}`;
        break;
      case 'views':
        orderClause += `view_count ${sortOrder}`;
        break;
      default:
        orderClause += `name ${sortOrder}`;
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // 전체 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM equipment ${whereClause}`;
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    
    // 실제 데이터 조회
    const searchQuery = `
      SELECT * FROM equipment 
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    const searchResults = await env.DB.prepare(searchQuery)
      .bind(...params, limit, offset).all();

    // 검색 로그 기록
    if (query.trim()) {
      await env.DB.prepare(`
        INSERT INTO search_logs (search_term, result_count, ip_address) 
        VALUES (?, ?, ?)
      `).bind(query, total, c.req.header('CF-Connecting-IP') || 'unknown').run();
    }

    return c.json({ 
      equipment: searchResults.results, 
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        query,
        category,
        brand,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});

// 장비 상세 정보 API
app.get('/api/equipment/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');

  try {
    const equipment = await env.DB.prepare('SELECT * FROM equipment WHERE id = ? AND status = ?')
      .bind(id, 'active').first();

    if (!equipment) {
      return c.json({ error: 'Equipment not found' }, 404);
    }

    // 조회수 증가
    await env.DB.prepare('UPDATE equipment SET view_count = view_count + 1 WHERE id = ?')
      .bind(id).run();

    // 상세 스펙 정보 조회
    const specs = await env.DB.prepare(`
      SELECT spec_name, spec_value, spec_unit, display_order 
      FROM equipment_specs 
      WHERE equipment_id = ? 
      ORDER BY display_order ASC, spec_name ASC
    `).bind(id).all();

    return c.json({ 
      equipment: {
        ...equipment,
        view_count: equipment.view_count + 1 // 증가된 조회수 반영
      },
      specs: specs.results
    });
  } catch (error) {
    console.error('Equipment detail error:', error);
    return c.json({ error: 'Failed to load equipment details' }, 500);
  }
});

// 카테고리별 장비 목록 API
app.get('/api/categories/:category', async (c) => {
  const { env } = c;
  const category = c.req.param('category');

  try {
    const equipment = await env.DB.prepare(`
      SELECT * FROM equipment WHERE category = ? ORDER BY name ASC
    `).bind(category).all();

    return c.json({ equipment: equipment.results });
  } catch (error) {
    console.error('Category error:', error);
    return c.json({ error: 'Failed to load category' }, 500);
  }
});

// 전체 카테고리 목록 API
app.get('/api/categories', async (c) => {
  const { env } = c;

  try {
    const categories = await env.DB.prepare(`
      SELECT category, COUNT(*) as count 
      FROM equipment 
      WHERE status = 'active'
      GROUP BY category 
      ORDER BY category ASC
    `).all();

    return c.json({ categories: categories.results });
  } catch (error) {
    console.error('Categories error:', error);
    return c.json({ error: 'Failed to load categories' }, 500);
  }
});

// 필터 옵션 API
app.get('/api/filters', async (c) => {
  const { env } = c;

  try {
    // 브랜드 목록
    const brands = await env.DB.prepare(`
      SELECT brand, COUNT(*) as count 
      FROM equipment 
      WHERE status = 'active'
      GROUP BY brand 
      ORDER BY brand ASC
    `).all();

    // 카테고리 목록
    const categories = await env.DB.prepare(`
      SELECT category, COUNT(*) as count 
      FROM equipment 
      WHERE status = 'active'
      GROUP BY category 
      ORDER BY category ASC
    `).all();

    // 가격 범위
    const priceRange = await env.DB.prepare(`
      SELECT 
        MIN(min_price) as min_price,
        MAX(max_price) as max_price
      FROM equipment 
      WHERE status = 'active' AND min_price > 0 AND max_price > 0
    `).first();

    // 인기 스펙들 (비교 가능한 것들)
    const popularSpecs = await env.DB.prepare(`
      SELECT spec_name, COUNT(DISTINCT equipment_id) as equipment_count
      FROM equipment_specs 
      WHERE is_comparable = 1
      GROUP BY spec_name
      HAVING equipment_count >= 2
      ORDER BY equipment_count DESC
      LIMIT 10
    `).all();

    return c.json({ 
      brands: brands.results,
      categories: categories.results,
      priceRange: priceRange,
      popularSpecs: popularSpecs.results
    });
  } catch (error) {
    console.error('Filters error:', error);
    return c.json({ error: 'Failed to load filters' }, 500);
  }
});

// 장비 비교 API
app.post('/api/compare', async (c) => {
  const { env } = c;
  const { equipmentIds } = await c.req.json();

  if (!equipmentIds || equipmentIds.length < 2 || equipmentIds.length > 4) {
    return c.json({ error: 'Please select 2-4 equipment for comparison' }, 400);
  }

  try {
    // 장비 기본 정보 조회
    const placeholders = equipmentIds.map(() => '?').join(',');
    const equipment = await env.DB.prepare(`
      SELECT * FROM equipment 
      WHERE id IN (${placeholders}) AND status = 'active'
      ORDER BY popularity_score DESC
    `).bind(...equipmentIds).all();

    if (equipment.results.length !== equipmentIds.length) {
      return c.json({ error: 'Some equipment not found' }, 404);
    }

    // 각 장비의 스펙 정보 조회
    const equipmentSpecs = {};
    const allSpecs = new Set();
    
    for (const eq of equipment.results) {
      const specs = await env.DB.prepare(`
        SELECT spec_name, spec_value, spec_unit 
        FROM equipment_specs 
        WHERE equipment_id = ? AND is_comparable = 1
        ORDER BY display_order ASC, spec_name ASC
      `).bind(eq.id).all();
      
      equipmentSpecs[eq.id] = {};
      specs.results.forEach(spec => {
        const specKey = spec.spec_name;
        equipmentSpecs[eq.id][specKey] = {
          value: spec.spec_value,
          unit: spec.spec_unit || ''
        };
        allSpecs.add(specKey);
      });
    }

    // 비교 로그 저장
    await env.DB.prepare(`
      INSERT INTO comparison_history (equipment_ids, ip_address) 
      VALUES (?, ?)
    `).bind(JSON.stringify(equipmentIds), c.req.header('CF-Connecting-IP') || 'unknown').run();

    // 비교 횟수 업데이트
    for (const id of equipmentIds) {
      await env.DB.prepare(`
        UPDATE equipment 
        SET comparison_count = comparison_count + 1 
        WHERE id = ?
      `).bind(id).run();
    }

    return c.json({
      equipment: equipment.results,
      specs: equipmentSpecs,
      allSpecs: Array.from(allSpecs).sort()
    });
  } catch (error) {
    console.error('Compare error:', error);
    return c.json({ error: 'Comparison failed' }, 500);
  }
});

// 인기 장비 API
app.get('/api/popular', async (c) => {
  const { env } = c;
  const limit = parseInt(c.req.query('limit') || '10');

  try {
    const popular = await env.DB.prepare(`
      SELECT * FROM equipment 
      WHERE status = 'active'
      ORDER BY popularity_score DESC, view_count DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({ equipment: popular.results });
  } catch (error) {
    console.error('Popular equipment error:', error);
    return c.json({ error: 'Failed to load popular equipment' }, 500);
  }
});

// 관리자 인증 API (완전히 간단한 버전)
app.post('/api/admin/login', async (c) => {
  const { username, password } = await c.req.json();
  
  console.log('Login attempt:', username, password); // 디버깅용
  
  // 하드코딩된 로그인 (가장 확실한 방법)
  if (username === 'admin' && password === 'admin123') {
    console.log('Login successful!');
    return c.json({ 
      success: true, 
      token: 'admin-token', 
      admin: { id: 1, username: 'admin' } 
    });
  }
  
  console.log('Login failed for:', username, password);
  return c.json({ error: 'Invalid credentials' }, 401);
});

// 관리자 장비 추가 API
app.post('/api/admin/equipment', async (c) => {
  const { env } = c;
  const equipmentData = await c.req.json();

  try {
    const result = await env.DB.prepare(`
      INSERT INTO equipment (name, category, brand, model, description, image_url, specifications, certifications, price_range, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      equipmentData.name,
      equipmentData.category,
      equipmentData.brand,
      equipmentData.model,
      equipmentData.description,
      equipmentData.image_url,
      JSON.stringify(equipmentData.specifications),
      JSON.stringify(equipmentData.certifications),
      equipmentData.price_range,
      equipmentData.tags
    ).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error('Add equipment error:', error);
    return c.json({ error: 'Failed to add equipment' }, 500);
  }
});

// 관리자 장비 수정 API
app.put('/api/admin/equipment/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  const equipmentData = await c.req.json();

  try {
    await env.DB.prepare(`
      UPDATE equipment SET 
        name = ?, category = ?, brand = ?, model = ?, description = ?, 
        image_url = ?, specifications = ?, certifications = ?, price_range = ?, tags = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      equipmentData.name,
      equipmentData.category,
      equipmentData.brand,
      equipmentData.model,
      equipmentData.description,
      equipmentData.image_url,
      JSON.stringify(equipmentData.specifications),
      JSON.stringify(equipmentData.certifications),
      equipmentData.price_range,
      equipmentData.tags,
      id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update equipment error:', error);
    return c.json({ error: 'Failed to update equipment' }, 500);
  }
});

// 관리자 장비 삭제 API
app.delete('/api/admin/equipment/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');

  try {
    await env.DB.prepare('DELETE FROM equipment WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete equipment error:', error);
    return c.json({ error: 'Failed to delete equipment' }, 500);
  }
});

// Main pages
app.get('/', (c) => {
  return c.render(
    <div>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">네트워크 장비 정보</h1>
              </div>
              <nav className="flex space-x-8">
                <a href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">홈</a>
                <a href="/list" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">장비목록</a>
                <a href="/compare" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">비교하기</a>
                <a href="/admin" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">관리자</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Search Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">네트워크/보안 장비 검색</h2>
            <p className="text-lg text-gray-600 mb-8">원하는 장비 정보를 빠르게 찾아보세요</p>
            
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  id="searchInput"
                  placeholder="장비명, 브랜드, 모델명으로 검색..."
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  id="searchBtn"
                  className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  검색
                </button>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onclick="goToList('보안')">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-shield-alt text-red-600"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">보안 장비</h3>
                  <p className="text-sm text-gray-500">방화벽, IPS, UTM 등</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onclick="goToList('네트워크')">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-network-wired text-blue-600"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">네트워크 장비</h3>
                  <p className="text-sm text-gray-500">스위치, 라우터, AP 등</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onclick="goToList('서버')">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-server text-green-600"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">서버 장비</h3>
                  <p className="text-sm text-gray-500">랙서버, 블레이드 등</p>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Equipment */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">인기 장비</h3>
            <div id="popularEquipment" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Popular equipment will be loaded by JavaScript */}
            </div>
          </div>

          {/* Quick Search Results */}
          <div id="quickSearchResults" className="hidden">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">빠른 검색 결과</h3>
            <div id="quickResultsList" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
              {/* Results will be populated by JavaScript */}
            </div>
            <div className="text-center">
              <button id="viewAllResults" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                전체 결과 보기
              </button>
            </div>
          </div>

          {/* Loading indicator */}
          <div id="loading" className="hidden text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">검색 중...</p>
          </div>
        </div>
      </div>
    </div>
  )
})

// Equipment detail page
app.get('/equipment/:id', (c) => {
  const id = c.req.param('id')
  
  return c.render(
    <div>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">네트워크 장비 정보</a>
              </div>
              <nav className="flex space-x-8">
                <a href="/" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">홈</a>
                <a href="/categories" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">카테고리</a>
                <a href="/admin" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">관리자</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Equipment Detail */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div id="equipmentDetail">
            {/* Content will be loaded by JavaScript */}
          </div>
          
          {/* Loading indicator */}
          <div id="loading" className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">장비 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
      
      <script dangerouslySetInnerHTML={{
        __html: `
          const equipmentId = '${id}';
          loadEquipmentDetail(equipmentId);
        `
      }} />
    </div>
  )
})

// Equipment List page (다나와 스타일)
app.get('/list', (c) => {
  return c.render(
    <div>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">네트워크 장비 정보</a>
              </div>
              <nav className="flex space-x-8">
                <a href="/" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">홈</a>
                <a href="/list" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">장비목록</a>
                <a href="/compare" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">비교하기</a>
                <a href="/admin" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">관리자</a>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Filter Panel */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">필터</h3>
                
                {/* Search within results */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                  <input
                    type="text"
                    id="filterSearch"
                    placeholder="장비명, 모델명..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <div id="categoryFilters" className="space-y-2">
                    {/* Categories will be loaded by JavaScript */}
                  </div>
                </div>

                {/* Brand Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">브랜드</label>
                  <div id="brandFilters" className="space-y-2 max-h-48 overflow-y-auto">
                    {/* Brands will be loaded by JavaScript */}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">가격대</label>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="number"
                        id="minPrice"
                        placeholder="최소 가격"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        id="maxPrice"
                        placeholder="최대 가격"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Filter Button */}
                <button
                  id="applyFilters"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  필터 적용
                </button>
                
                <button
                  id="resetFilters"
                  className="w-full mt-2 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none"
                >
                  필터 초기화
                </button>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="lg:w-3/4">
              {/* Toolbar */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <span id="resultCount" className="text-sm text-gray-600">검색 결과: 0개</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">정렬:</span>
                      <select
                        id="sortSelect"
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="name-asc">이름순</option>
                        <option value="price-asc">가격 낮은순</option>
                        <option value="price-desc">가격 높은순</option>
                        <option value="popularity-desc">인기순</option>
                        <option value="newest-desc">최신순</option>
                        <option value="views-desc">조회순</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">선택된 비교 장비:</span>
                      <span id="compareCount" className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">0</span>
                    </div>
                    <button
                      id="compareBtn"
                      disabled
                      className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      비교하기
                    </button>
                  </div>
                </div>
              </div>

              {/* Equipment List */}
              <div id="equipmentList" className="space-y-4">
                {/* Equipment items will be loaded by JavaScript */}
              </div>

              {/* Pagination */}
              <div id="pagination" className="mt-8 flex justify-center">
                {/* Pagination will be loaded by JavaScript */}
              </div>

              {/* Loading */}
              <div id="listLoading" className="hidden text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">장비 목록을 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Compare page
app.get('/compare', (c) => {
  return c.render(
    <div>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">네트워크 장비 정보</a>
              </div>
              <nav className="flex space-x-8">
                <a href="/" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">홈</a>
                <a href="/list" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">장비목록</a>
                <a href="/compare" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">비교하기</a>
                <a href="/admin" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">관리자</a>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div id="compareContent">
            {/* Default comparison page content */}
            <div className="text-center py-12">
              <i className="fas fa-balance-scale text-6xl text-gray-400 mb-4"></i>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">장비 비교</h2>
              <p className="text-gray-600 mb-8">장비 목록에서 2-4개의 장비를 선택하여 비교해보세요.</p>
              <a href="/list" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <i className="fas fa-list mr-2"></i>
                장비 목록으로 이동
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Admin page
app.get('/admin', (c) => {
  return c.render(
    <div>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">네트워크 장비 정보</a>
              </div>
              <nav className="flex space-x-8">
                <a href="/" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">홈</a>
                <a href="/categories" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium">카테고리</a>
                <a href="/admin" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">관리자</a>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Login Form */}
          <div id="loginForm" className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">관리자 로그인</h2>
            <form id="adminLoginForm">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">사용자명</label>
                <input type="text" id="username" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                <input type="password" id="password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                로그인
              </button>
            </form>
          </div>

          {/* Admin Panel */}
          <div id="adminPanel" className="hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">장비 관리</h2>
              <div className="space-x-4">
                <button id="addEquipmentBtn" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                  장비 추가
                </button>
                <button id="logoutBtn" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                  로그아웃
                </button>
              </div>
            </div>

            {/* Equipment List */}
            <div id="adminEquipmentList" className="bg-white rounded-lg shadow">
              {/* Content will be loaded by JavaScript */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default app
