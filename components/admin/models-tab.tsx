'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Pencil } from 'lucide-react';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
}

export function ModelsTab() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);

  // Form state
  const [formData, setFormData] = useState<ModelConfig>({
    id: '',
    name: '',
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
  });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/config/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    let newModels = [...models];
    if (editingModel) {
      // Update
      newModels = newModels.map((m) => (m.id === editingModel.id ? formData : m));
    } else {
      // Add
      // Ensure unique ID
      if (newModels.find((m) => m.id === formData.id)) {
        alert('Model ID already exists');
        return;
      }
      newModels.push(formData);
    }

    try {
      const res = await fetch('/api/config/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModels),
      });
      
      if (res.ok) {
        setModels(newModels);
        setIsDialogOpen(false);
        resetForm();
      } else {
        alert('Failed to save');
      }
    } catch (e) {
      alert('Error saving');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此模型?')) return;
    
    const newModels = models.filter((m) => m.id !== id);
    try {
      await fetch('/api/config/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModels),
      });
      setModels(newModels);
    } catch (e) {
      alert('Error deleting');
    }
  };

  const openAddDialog = () => {
    setEditingModel(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (model: ModelConfig) => {
    setEditingModel(model);
    setFormData(model);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
    });
  };

  if (loading) return <div>加载中...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>模型配置</CardTitle>
          <CardDescription>添加或管理可用的 AI 模型</CardDescription>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="w-4 h-4 mr-2" /> 添加模型
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {models.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无模型配置</div>
          ) : (
            models.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
              >
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm text-muted-foreground flex gap-2">
                    <span className="bg-background px-1.5 rounded text-xs border">{model.provider}</span>
                    <span>{model.id}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(model)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(model.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingModel ? '编辑模型' : '添加模型'}</DialogTitle>
              <DialogDescription>配置模型的连接参数</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">显示名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：GPT-4 Turbo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="id">Model ID (API)</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="例如：gpt-4-turbo"
                  disabled={!!editingModel} // 编辑时不允许改ID，因为它是key
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider">提供商</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(v) => setFormData({ ...formData, provider: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="custom">Custom (OpenAI Compatible)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="baseUrl">Base URL (可选)</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl || ''}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://api.example.com/v1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
