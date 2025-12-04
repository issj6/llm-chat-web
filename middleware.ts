import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * 1. /api/auth/* (登录接口需要放行)
     * 2. /_next/* (Next.js 内部资源)
     * 3. /favicon.ico, /public/* (静态资源)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. 管理员路由保护
  if (pathname.startsWith('/admin')) {
    // 允许访问登录页
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // 检查管理员 Cookie
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || adminSession.value !== 'authenticated_admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // 2. 全局访问保护
  // 排除 /login 页面本身，避免重定向循环
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // 排除 /api 路由（除了 /api/chat，其他 /api 路由通常需要单独的鉴权逻辑，这里主要保护前端页面）
  // 但 chat 接口也应该受全局保护
  const isApiRoute = pathname.startsWith('/api');
  const isChatApi = pathname.startsWith('/api/chat');

  // 如果是普通 API 路由（非 chat），我们暂时放行，由 API 内部做具体的鉴权（比如 config 接口）
  // 但如果是页面访问或 chat 接口，需要检查全局开关
  if (!isApiRoute || isChatApi) {
    try {
      // 检查是否开启了全局验证
      // 注意：kv.get 在 Edge Runtime 下是支持的
      let isGlobalAuthEnabled = false;
      
      // 优先从 KV 读取
      const kvEnabled = await kv.get<boolean>('sys:global_auth_enabled');
      if (kvEnabled !== null) {
        isGlobalAuthEnabled = kvEnabled;
      } else {
        // 环境变量回退 (Edge 无法直接读取 process.env.ENABLE_GLOBAL_AUTH 如果没配置好，
        // 但通常 Next.js 会注入。这里为保险起见，如果 KV 没设，默认为 false)
        // 也可以尝试读取 process.env，但在 middleware 中要注意兼容性
        isGlobalAuthEnabled = process.env.ENABLE_GLOBAL_AUTH === 'true';
      }

      if (isGlobalAuthEnabled) {
        const siteToken = request.cookies.get('site_access_token');
        if (!siteToken || siteToken.value !== 'authenticated_user') {
          // 如果是 API 请求，返回 401
          if (isChatApi) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          
          // 如果是页面请求，重定向到登录页
          const url = request.nextUrl.clone();
          url.pathname = '/login';
          return NextResponse.redirect(url);
        }
      }
    } catch (e) {
      console.error('Middleware KV Error:', e);
      // 如果 KV 挂了，为了安全起见，最好放行或报错。这里选择放行（假设默认无密码）或根据需求调整。
      // 暂时放行。
    }
  }

  return NextResponse.next();
}
