"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  PanelLeftClose, 
  PanelLeft,
  MoreHorizontal,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatSession } from "@/hooks/use-chat-history";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, title: string) => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  isOpen,
  onToggle,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
}: ChatSidebarProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const handleRename = (session: ChatSession) => {
    setRenameSessionId(session.id);
    setRenameTitle(session.title);
    setRenameDialogOpen(true);
  };

  const confirmRename = () => {
    if (renameSessionId && renameTitle.trim()) {
      onRenameSession(renameSessionId, renameTitle.trim());
    }
    setRenameDialogOpen(false);
    setRenameSessionId(null);
    setRenameTitle("");
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "今天";
    } else if (diffDays === 1) {
      return "昨天";
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    }
  };

  // 按时间分组会话
  const groupedSessions = sessions.reduce((groups, session) => {
    const timeLabel = formatTime(session.updatedAt);
    if (!groups[timeLabel]) {
      groups[timeLabel] = [];
    }
    groups[timeLabel].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  return (
    <>
      {/* 侧边栏 */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-muted/50 backdrop-blur-sm transition-all duration-300 ease-in-out",
          "border-r flex flex-col",
          isOpen ? "w-64" : "w-0"
        )}
      >
        {isOpen && (
          <>
            {/* 头部 */}
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="font-semibold text-sm">聊天记录</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onNewChat}
                  title="新对话"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggle}
                  title="关闭侧边栏"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 会话列表 */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-4">
                {Object.entries(groupedSessions).map(([timeLabel, groupSessions]) => (
                  <div key={timeLabel}>
                    <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                      {timeLabel}
                    </div>
                    <div className="space-y-1">
                      {groupSessions.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors",
                            session.id === currentSessionId
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          )}
                          onClick={() => onSelectSession(session.id)}
                        >
                          <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                          <span className="flex-1 truncate">{session.title}</span>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem onClick={() => handleRename(session)}>
                                <Pencil className="h-3 w-3 mr-2" />
                                重命名
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => onDeleteSession(session.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    暂无聊天记录
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* 打开侧边栏按钮（当侧边栏关闭时显示） */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-3 top-3 z-50 h-9 w-9"
          onClick={onToggle}
          title="打开侧边栏"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}

      {/* 重命名对话框 */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>重命名对话</DialogTitle>
            <DialogDescription>
              输入新的对话标题
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            placeholder="对话标题"
            onKeyDown={(e) => e.key === "Enter" && confirmRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmRename}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
