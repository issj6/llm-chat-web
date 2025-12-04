import { NextResponse } from 'next/server';
import { storage } from '@/lib/kv';
import { ModelConfig } from '@/components/admin/models-tab';

export async function GET() {
  const models = await storage.get<ModelConfig[]>('config:models') || [];
  
  // 只返回安全的信息
  const publicModels = models.map(m => ({
    id: m.id,
    name: m.name,
    provider: m.provider
  }));

  return NextResponse.json(publicModels);
}
