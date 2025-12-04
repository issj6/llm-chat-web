import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { type } = await request.json();
    
    if (type === 'admin') {
      await clearAuthCookie('admin');
    } else if (type === 'site') {
      await clearAuthCookie('site');
    } else {
      // Default clear both if not specified or unknown
      await clearAuthCookie('admin');
      await clearAuthCookie('site');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
