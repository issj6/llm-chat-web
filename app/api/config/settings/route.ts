import { NextResponse } from 'next/server';
import { storage } from '@/lib/kv';
import { cookies } from 'next/headers';
import { hash } from 'bcryptjs';

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated_admin';
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [globalEnabled, globalPwd] = await Promise.all([
    storage.get('sys:global_auth_enabled'),
    storage.get('sys:global_password'),
  ]);

  return NextResponse.json({
    globalAuthEnabled: !!globalEnabled,
    // 不返回密码明文，只返回是否设置了
    hasGlobalPassword: !!globalPwd,
  });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, value } = body;

    if (type === 'admin_password') {
      // 修改管理员密码
      const hashedPassword = await hash(value, 10);
      await storage.set('sys:admin_password', hashedPassword);
    } else if (type === 'global_auth_enabled') {
      // 开关全局验证
      await storage.set('sys:global_auth_enabled', value === true);
    } else if (type === 'global_password') {
      // 修改全局访问密码
      // 这里简单存明文或简单hash，方便前端比对（如果需要在前端比对的话，但这里是在后端比对）
      // 为了安全还是建议后端比对。这里为了简单直接存。
      await storage.set('sys:global_password', value);
    } else {
      return NextResponse.json({ error: 'Unknown setting type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
