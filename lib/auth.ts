import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import { storage } from './kv';

export const ADMIN_COOKIE_NAME = 'admin_session';
export const SITE_COOKIE_NAME = 'site_access_token';

/**
 * 验证管理员密码
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  // 优先从 KV 获取密码 hash
  const storedHash = await storage.get<string>('sys:admin_password');
  
  if (storedHash) {
    return compare(password, storedHash);
  }
  
  // 如果 KV 中没有，使用环境变量中的初始密码（仅作后备，建议首次登录后修改）
  // 注意：环境变量中的是明文，这里直接比对（为了安全，建议尽快在面板中修改密码存入 KV）
  const initPassword = process.env.ADMIN_INIT_PASSWORD || 'admin123';
  // 如果输入密码等于初始密码，视为验证通过
  // 实际生产中应该在初始化时就写入 KV，这里为了简化部署流程做此兼容
  return password === initPassword;
}

/**
 * 验证全局访问密码
 */
export async function verifyGlobalPassword(password: string): Promise<boolean> {
  const storedPassword = await storage.get<string>('sys:global_password');
  if (!storedPassword) return false;
  // 全局密码简单比对即可，也可以升级为 hash
  return password === storedPassword;
}

/**
 * 检查是否需要全局验证
 */
export async function isGlobalAuthEnabled(): Promise<boolean> {
  // 优先读取 KV 配置
  const kvEnabled = await storage.get<boolean>('sys:global_auth_enabled');
  if (kvEnabled !== null) return kvEnabled;
  
  // 回退到环境变量
  return process.env.ENABLE_GLOBAL_AUTH === 'true';
}

/**
 * 辅助函数：设置 Cookie (在 API Route 或 Server Action 中使用)
 */
export async function setAuthCookie(type: 'admin' | 'site') {
  const cookieStore = await cookies();
  const name = type === 'admin' ? ADMIN_COOKIE_NAME : SITE_COOKIE_NAME;
  // 简单设置一个标记，生产环境建议使用 JWT 或更安全的 Session ID
  const value = type === 'admin' ? 'authenticated_admin' : 'authenticated_user';
  
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * 辅助函数：清除 Cookie
 */
export async function clearAuthCookie(type: 'admin' | 'site') {
  const cookieStore = await cookies();
  const name = type === 'admin' ? ADMIN_COOKIE_NAME : SITE_COOKIE_NAME;
  cookieStore.delete(name);
}
