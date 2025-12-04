'use client';

import { useState, useEffect } from 'react';
import { Thread } from "@/components/assistant-ui/thread";
import { useChat } from "@ai-sdk/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

interface PublicModel {
  id: string;
  name: string;
  provider: string;
}

function ChatRuntimeWrapper({ modelId }: { modelId: string }) {
  const chat = useChat({
    // @ts-ignore
    api: '/api/chat',
    body: { modelId },
  });

  const runtime = useAISDKRuntime(chat);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread 
        welcomeMessage="你好！我是 AI 助手，有什么我可以帮你的吗？"
      />
    </AssistantRuntimeProvider>
  );
}

export function ChatInterface() {
  const [models, setModels] = useState<PublicModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then((data: PublicModel[]) => {
        setModels(data);
        if (data.length > 0) {
          // 尝试从 localStorage 恢复上次选择的模型，或者默认选第一个
          const savedModel = localStorage.getItem('last_model_id');
          if (savedModel && data.find(m => m.id === savedModel)) {
            setSelectedModelId(savedModel);
          } else {
            setSelectedModelId(data[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleModelChange = (val: string) => {
    setSelectedModelId(val);
    localStorage.setItem('last_model_id', val);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">加载配置中...</div>;
  }

  if (models.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>未配置模型</AlertTitle>
          <AlertDescription>
            系统暂无可用的 AI 模型。请联系管理员在
            <Link href="/admin/login" className="font-medium underline underline-offset-4 ml-1">
              管理面板
            </Link>
            中添加模型配置。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 h-14 border-b bg-muted/20 shrink-0 z-10">
        <div className="font-semibold">AI Chat</div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/login">管理员面板</Link>
          </Button>
          <div className="w-[200px]">
            <Select value={selectedModelId} onValueChange={handleModelChange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden relative">
        {selectedModelId && (
          <ChatRuntimeWrapper key={selectedModelId} modelId={selectedModelId} />
        )}
      </div>
    </div>
  );
}
