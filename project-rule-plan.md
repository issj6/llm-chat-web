# AI Chat Web 项目实施计划书

## 1. 项目概述

构建一个基于 Next.js 的 AI 聊天 Web 应用。核心特点是**无独立后端**、**配置云端化 (Vercel KV)**、**聊天记录本地化**以及**多模型支持**。应用包含一个受保护的管理员面板，用于管理全站访问权限和模型配置。

## 2. 技术栈架构

-   **框架**: Next.js 14+ (App Router) - 负责前端渲染及 API Routes。
-   **AI 引擎**: Vercel AI SDK (Core & UI) - 处理流式传输和模型交互。
-   **UI 组件**:
    -   **Assistant UI**: 专用的 AI 聊天 UI 库，提供美观、稳定的对话组件。
    -   **Tailwind CSS**: 样式原子化。
    -   **Shadcn/ui**: 通用 UI 组件（按钮、表单、弹窗等）。
    -   **Lucide React**: 图标库。
-   **数据存储 (配置层)**: Vercel KV (Redis) - 存储管理员密码 hash、全局访问密码、模型列表（含 API Key 加密存储）。
-   **数据存储 (用户层)**: Browser LocalStorage / IndexedDB - 存储聊天历史记录（利用 Assistant UI 的持久化能力）。
-   **部署**: Vercel。

## 3. 核心功能模块设计

### 3.1 权限与认证系统 (Auth & Security)
-   **管理员认证**:
    -   基于 Cookie 的简单会话认证。
    -   默认管理员密码通过环境变量 `ADMIN_INIT_PASSWORD` 初始化，后续可修改存入 KV。
-   **全局访问控制**:
    -   利用 Next.js Middleware (`middleware.ts`) 拦截非静态资源请求。
    -   检查 KV 中是否开启 `ENABLE_GLOBAL_AUTH`。
    -   若开启，验证用户 Cookie 中的访问令牌。

### 3.2 数据结构 (Vercel KV Schema)
为了保持简单，我们将使用以下 Key-Value 结构：
-   `sys:admin_password`: String (Bcrypt hash) - 管理员密码。
-   `sys:global_password`: String (明文或简单Hash，用于比对) - 全局访问密码。
-   `sys:global_auth_enabled`: Boolean - 是否开启全局验证。
-   `config:models`: JSON Array - 模型配置列表。
    ```json
    [
      {
        "id": "gpt-4o",
        "name": "GPT-4 Omni",
        "provider": "openai", // openai, anthropic, google, etc.
        "apiKey": "sk-...",   // 存储时建议加密或在API层解密
        "baseUrl": ""         // 可选，用于中转
      }
    ]
    ```

### 3.3 聊天系统 (Chat Interface)
-   **界面**: 使用 Assistant UI 的 `<Thread />` 组件。
-   **模型切换**: 在聊天头部或设置区提供下拉菜单，数据源自 KV 配置。
-   **API 路由**: `/api/chat`
    -   接收前端传来的 `messages` 和 `modelId`。
    -   从 KV 获取对应 `modelId` 的配置 (API Key)。
    -   使用 Vercel AI SDK 动态实例化模型并流式返回。

### 3.4 管理员面板 (Admin Dashboard)
-   路径: `/admin`
-   功能:
    -   修改管理员密码。
    -   全局访问开关及密码设置。
    -   模型管理 CRUD（添加/编辑/删除模型配置）。

## 4. 目录结构规划

```text
/
├── app/
│   ├── (auth)/             # 认证相关页面
│   │   ├── login/          # 全局访问登录
│   │   └── admin/login/    # 管理员登录
│   ├── (chat)/             # 聊天主界面 (无需额外布局)
│   │   └── page.tsx
│   ├── admin/              # 管理员面板 (受保护)
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── chat/           # AI 对话接口
│   │   ├── auth/           # 登录验证接口
│   │   └── config/         # 配置管理接口 (CRUD)
│   └── layout.tsx
├── components/
│   ├── ui/                 # Shadcn 组件
│   ├── assistant-ui/       # Assistant UI 自定义组件
│   └── admin/              # 管理面板组件
├── lib/
│   ├── kv.ts               # Vercel KV 客户端封装
│   ├── auth.ts             # 权限验证工具函数
│   └── store.ts            # 前端状态管理 (Zustand/Context)
└── middleware.ts           # 路由保护
```

## 5. 实施步骤

### 第一阶段：基础建设
1.  初始化 Next.js 项目，配置 TypeScript, Tailwind。
2.  安装依赖: `ai`, `@assistant-ui/react`, `@vercel/kv`, `lucide-react`, `clsx`, `tailwind-merge`。
3.  配置 Shadcn/ui 基础组件。
4.  配置 Vercel KV 连接并编写 `lib/kv.ts`。

### 第二阶段：核心逻辑与后端
1.  实现 `middleware.ts`，处理路由拦截。
2.  实现管理员登录 API (`/api/auth/admin-login`)。
3.  实现全局访问登录 API (`/api/auth/site-login`)。
4.  实现配置管理 API (`/api/config/models` 等)。

### 第三阶段：管理员面板开发
1.  开发 `/admin/login` 页面。
2.  开发 `/admin/dashboard` 页面：
    -   设置全局密码表单。
    -   模型列表管理（添加、删除、编辑 API Key 和 模型名）。

### 第四阶段：聊天功能开发
1.  集成 Assistant UI 到主页。
2.  实现 `/api/chat`：
    -   解析请求中的 `modelId`。
    -   从 KV 读取配置。
    -   调用 Vercel AI SDK 的 `streamText`。
3.  实现前端模型选择器，与 Assistant UI 状态联动。
4.  验证本地存储功能 (Assistant UI 自带支持 `Runtime` 本地化)。

### 第五阶段：优化与测试
1.  UI 美化与暗黑模式适配。
2.  错误处理（API Key 无效、网络中断等）。
3.  编写测试用例。
4.  Review 代码并整理文档。

## 6. 开发规范 (User Rules)
-   **语言**: 代码注释及文档使用中文。
-   **组件**: 优先使用 Shadcn/ui 保持风格统一。
-   **存储**: 敏感信息（API Key）仅在服务端内存/KV流转，不暴露给前端。
-   **环境**: 确保本地开发通过 `.env.local` 模拟 KV 环境变量。
