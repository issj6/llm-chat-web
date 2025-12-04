'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner'; // 需要安装 sonner 或者使用 alert

// 暂时用 alert 代替 toast，或者你可以指示我安装 sonner
// 这里先用 window.alert 简单处理，或者如果 shadcn 有 toast 我们就用 toast
// Shadcn 通常用 sonner 或 toast。我先安装 sonner。

export function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [globalAuthEnabled, setGlobalAuthEnabled] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newGlobalPassword, setNewGlobalPassword] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/config/settings');
      if (res.ok) {
        const data = await res.json();
        setGlobalAuthEnabled(data.globalAuthEnabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (type: string, value: any) => {
    try {
      const res = await fetch('/api/config/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value }),
      });
      if (!res.ok) throw new Error('Update failed');
      alert('设置已更新');
      if (type === 'global_auth_enabled') {
        setGlobalAuthEnabled(value);
      }
      if (type === 'admin_password') setNewAdminPassword('');
      if (type === 'global_password') setNewGlobalPassword('');
    } catch (e) {
      alert('更新失败');
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>全局访问控制</CardTitle>
          <CardDescription>控制是否需要密码才能访问本站聊天功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="global-auth">开启全局密码验证</Label>
            <Switch
              id="global-auth"
              checked={globalAuthEnabled}
              onCheckedChange={(checked) => updateSetting('global_auth_enabled', checked)}
            />
          </div>
          
          {globalAuthEnabled && (
            <div className="space-y-2 pt-4 border-t">
              <Label>设置全局访问密码</Label>
              <div className="flex gap-2">
                <Input 
                  type="password" 
                  placeholder="输入新密码" 
                  value={newGlobalPassword}
                  onChange={(e) => setNewGlobalPassword(e.target.value)}
                />
                <Button onClick={() => updateSetting('global_password', newGlobalPassword)} disabled={!newGlobalPassword}>
                  更新
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>管理员安全</CardTitle>
          <CardDescription>修改管理员登录密码</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>新管理员密码</Label>
            <div className="flex gap-2">
              <Input 
                type="password" 
                placeholder="输入新密码" 
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
              />
              <Button onClick={() => updateSetting('admin_password', newAdminPassword)} disabled={!newAdminPassword}>
                更新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
