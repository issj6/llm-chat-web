import { NextResponse } from 'next/server';
import { storage } from '@/lib/kv';
import { cookies } from 'next/headers';

// 简单的鉴权：检查 admin cookie
async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated_admin';
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const models = await storage.get('config:models') || [];
  return NextResponse.json(models);
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // 简单的校验，实际应更严格
    if (!Array.isArray(body)) {
      throw new Error('Invalid format');
    }
    
    await storage.set('config:models', body);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
