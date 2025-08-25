// 개인 PC용 간단한 로그인 API (보안이 중요하지 않은 로컬 환경용)
// 이 코드를 src/index.tsx의 관리자 로그인 API 부분에 복사해서 사용하세요

// 관리자 인증 API (간단한 버전)
app.post('/api/admin/login', async (c) => {
  const { env } = c;
  const { username, password } = await c.req.json();

  try {
    // 평문 비밀번호 직접 비교 (로컬 개발용)
    const admin = await env.DB.prepare(`
      SELECT * FROM admin_users WHERE username = ? AND password_hash = ?
    `).bind(username, password).first();

    if (admin) {
      return c.json({ 
        success: true, 
        token: 'admin-token', 
        admin: { id: admin.id, username: admin.username } 
      });
    } else {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});