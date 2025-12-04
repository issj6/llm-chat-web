"use client";

import { useState, useEffect, useCallback } from "react";

// 聊天会话类型
export interface ChatSession {
  id: string;
  title: string;
  modelId: string;
  createdAt: number;
  updatedAt: number;
}

// 聊天消息类型（简化版，用于存储）
export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

const SESSIONS_KEY = "chat_sessions";
const MESSAGES_PREFIX = "chat_messages_";
const CURRENT_SESSION_KEY = "current_session_id";

/**
 * 聊天历史管理 Hook
 * 使用 localStorage 存储聊天记录
 */
export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载会话列表
  useEffect(() => {
    const storedSessions = localStorage.getItem(SESSIONS_KEY);
    if (storedSessions) {
      try {
        setSessions(JSON.parse(storedSessions));
      } catch (e) {
        console.error("Failed to parse sessions:", e);
      }
    }
    
    const storedCurrentId = localStorage.getItem(CURRENT_SESSION_KEY);
    if (storedCurrentId) {
      setCurrentSessionId(storedCurrentId);
    }
    
    setIsLoaded(true);
  }, []);

  // 保存会话列表
  const saveSessions = useCallback((newSessions: ChatSession[]) => {
    setSessions(newSessions);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
  }, []);

  // 创建新会话
  const createSession = useCallback((modelId: string, title?: string): string => {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const newSession: ChatSession = {
      id,
      title: title || "新对话",
      modelId,
      createdAt: now,
      updatedAt: now,
    };
    
    const newSessions = [newSession, ...sessions];
    saveSessions(newSessions);
    setCurrentSessionId(id);
    localStorage.setItem(CURRENT_SESSION_KEY, id);
    
    return id;
  }, [sessions, saveSessions]);

  // 切换会话
  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
  }, []);

  // 更新会话标题
  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    const newSessions = sessions.map(s => 
      s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s
    );
    saveSessions(newSessions);
  }, [sessions, saveSessions]);

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    const newSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(newSessions);
    
    // 删除对应的消息
    localStorage.removeItem(`${MESSAGES_PREFIX}${sessionId}`);
    
    // 如果删除的是当前会话，切换到第一个会话或清空
    if (currentSessionId === sessionId) {
      if (newSessions.length > 0) {
        switchSession(newSessions[0].id);
      } else {
        setCurrentSessionId(null);
        localStorage.removeItem(CURRENT_SESSION_KEY);
      }
    }
  }, [sessions, currentSessionId, saveSessions, switchSession]);

  // 获取会话消息
  const getSessionMessages = useCallback((sessionId: string): StoredMessage[] => {
    const stored = localStorage.getItem(`${MESSAGES_PREFIX}${sessionId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse messages:", e);
      }
    }
    return [];
  }, []);

  // 保存会话消息
  const saveSessionMessages = useCallback((sessionId: string, messages: StoredMessage[]) => {
    localStorage.setItem(`${MESSAGES_PREFIX}${sessionId}`, JSON.stringify(messages));
    
    // 更新会话的 updatedAt
    const newSessions = sessions.map(s => 
      s.id === sessionId ? { ...s, updatedAt: Date.now() } : s
    );
    saveSessions(newSessions);
  }, [sessions, saveSessions]);

  // 根据第一条消息自动生成标题
  const autoGenerateTitle = useCallback((sessionId: string, firstMessage: string) => {
    // 截取前30个字符作为标题
    const title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "..." : "");
    updateSessionTitle(sessionId, title);
  }, [updateSessionTitle]);

  // 获取当前会话
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  return {
    sessions,
    currentSessionId,
    currentSession,
    isLoaded,
    createSession,
    switchSession,
    updateSessionTitle,
    deleteSession,
    getSessionMessages,
    saveSessionMessages,
    autoGenerateTitle,
  };
}
