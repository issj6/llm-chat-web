'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Thread } from "@/components/assistant-ui/thread";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { useChatHistory } from "@/hooks/use-chat-history";
import { cn } from "@/lib/utils";

interface PublicModel {
  id: string;
  name: string;
  provider: string;
}

// 从 localStorage 加载消息
function loadMessages(sessionId: string): UIMessage[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(`chat_messages_${sessionId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse messages:", e);
    }
  }
  return [];
}

// 保存消息到 localStorage
function saveMessages(sessionId: string, messages: UIMessage[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
}

function ChatRuntimeWrapper({ 
  modelId, 
  sessionId,
  onFirstMessage,
}: { 
  modelId: string;
  sessionId: string;
  onFirstMessage?: (message: string) => void;
}) {
  // 加载初始消息
  const initialMessages = loadMessages(sessionId);
  const hasCalledFirstMessage = useRef(false);
  
  const chat = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { modelId },
    }),
    onFinish: () => {
      // 保存消息到 localStorage
      saveMessages(sessionId, chat.messages);
      
      // 当第一条消息完成时，自动生成标题
      if (chat.messages.length === 2 && onFirstMessage && !hasCalledFirstMessage.current) {
        hasCalledFirstMessage.current = true;
        const firstUserMessage = chat.messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          // 从 parts 中提取文本内容
          const textContent = firstUserMessage.parts
            ?.filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('') || '';
          if (textContent) {
            onFirstMessage(textContent);
          }
        }
      }
    },
  });

  // 当消息变化时保存（包括用户发送的消息）
  useEffect(() => {
    if (chat.messages.length > 0) {
      saveMessages(sessionId, chat.messages);
    }
  }, [chat.messages, sessionId]);

  const runtime = useAISDKRuntime(chat);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}

export function ChatInterface() {
  const [models, setModels] = useState<PublicModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    sessions,
    currentSessionId,
    isLoaded,
    createSession,
    switchSession,
    updateSessionTitle,
    deleteSession,
    autoGenerateTitle,
  } = useChatHistory();

  // 加载模型列表
  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then((data: PublicModel[]) => {
        setModels(data);
        if (data.length > 0) {
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

  // 当历史记录加载完成且没有当前会话时，创建新会话
  useEffect(() => {
    if (isLoaded && !currentSessionId && selectedModelId && sessions.length === 0) {
      createSession(selectedModelId);
    }
  }, [isLoaded, currentSessionId, selectedModelId, sessions.length, createSession]);

  const handleModelChange = (val: string) => {
    setSelectedModelId(val);
    localStorage.setItem('last_model_id', val);
  };

  const handleNewChat = useCallback(() => {
    if (selectedModelId) {
      createSession(selectedModelId);
    }
  }, [selectedModelId, createSession]);

  const handleFirstMessage = useCallback((message: string) => {
    if (currentSessionId) {
      autoGenerateTitle(currentSessionId, message);
    }
  }, [currentSessionId, autoGenerateTitle]);

  if (loading || !isLoaded) {
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
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onSelectSession={switchSession}
        onDeleteSession={deleteSession}
        onRenameSession={updateSessionTitle}
      />

      {/* 主内容区 */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        <header className="flex items-center justify-between px-4 h-14 border-b bg-muted/20 shrink-0 z-10">
          <div className={cn("font-semibold", !sidebarOpen && "ml-12")}>
            AI Chat
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleNewChat}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              新对话
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/login">管理面板</Link>
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
          {selectedModelId && currentSessionId && (
            <ChatRuntimeWrapper 
              key={currentSessionId} 
              modelId={selectedModelId}
              sessionId={currentSessionId}
              onFirstMessage={handleFirstMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
