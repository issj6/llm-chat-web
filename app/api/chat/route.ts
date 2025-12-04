import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { storage } from '@/lib/kv';
import { ModelConfig } from '@/components/admin/models-tab'; // 复用类型定义，虽然通常应该单独定义

// 设置最大执行时间，防止超时
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, modelId } = await req.json();

    // 1. 获取模型配置
    const models = await storage.get<ModelConfig[]>('config:models') || [];
    
    console.log('--- DEBUG: Chat API (Retry) ---');
    console.log('Payload modelId:', modelId);
    console.log('KV Models count:', models.length);
    console.log('KV Model IDs:', models.map(m => m.id));
    console.log('Match found:', models.some(m => m.id === modelId));
    console.log('-------------------------------');

    const config = models.find(m => m.id === modelId);

    if (!config) {
      return new Response(`Model '${modelId}' not found or configured. Available: ${models.map(m => m.id).join(', ')}`, { status: 400 });
    }

    // 2. 初始化 Provider
    let model;
    
    switch (config.provider) {
      case 'openai':
      case 'custom': // Custom 通常兼容 OpenAI
        const openai = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseUrl || undefined,
        });
        model = openai(config.id);
        break;
        
      case 'anthropic':
        const anthropic = createAnthropic({
          apiKey: config.apiKey,
          baseURL: config.baseUrl || undefined,
        });
        model = anthropic(config.id);
        break;
        
      case 'google':
        const google = createGoogleGenerativeAI({
          apiKey: config.apiKey,
          baseURL: config.baseUrl || undefined,
        });
        model = google(config.id);
        break;
        
      default:
        return new Response(`Provider ${config.provider} not supported yet`, { status: 400 });
    }

    // 3. 流式输出
    const result = streamText({
      model,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
