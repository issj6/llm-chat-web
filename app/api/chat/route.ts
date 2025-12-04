import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { storage } from '@/lib/kv';
import { ModelConfig } from '@/components/admin/models-tab';

// 设置最大执行时间，防止超时
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, modelId } = await req.json();

    // 1. 获取模型配置
    const models = await storage.get<ModelConfig[]>('config:models') || [];

    const config = models.find(m => m.id === modelId);

    if (!config) {
      return new Response(`Model '${modelId}' not found or configured. Available: ${models.map(m => m.id).join(', ')}`, { status: 400 });
    }

    // 2. 初始化 Provider
    let model;
    
    switch (config.provider) {
      case 'openai':
        // 官方 OpenAI API
        const openai = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseUrl || undefined,
        });
        model = openai(config.id);
        break;
      
      case 'openrouter':
        // OpenRouter - 使用专用 provider
        const openrouter = createOpenRouter({
          apiKey: config.apiKey,
        });
        model = openrouter.chat(config.id);
        break;

      case 'custom':
        // 自定义 OpenAI 兼容 API（如 302.ai、OneAPI、New API 等）
        if (!config.baseUrl) {
          return new Response('Custom provider requires Base URL', { status: 400 });
        }
        const customProvider = createOpenAICompatible({
          name: 'custom',
          apiKey: config.apiKey,
          baseURL: config.baseUrl,
        });
        model = customProvider(config.id);
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
