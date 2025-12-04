import { NextResponse } from 'next/server';
import { verifyAdminPassword, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);

    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    await setAuthCookie('admin');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: error.message || 'Invalid request' }, { status: 400 });
  }
}
