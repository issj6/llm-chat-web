"use client";

import { makePrismAsyncLightSyntaxHighlighter } from "@assistant-ui/react-syntax-highlighter";

/**
 * 使用 Prism 的异步语法高亮器
 * 支持多种编程语言的代码高亮
 */
export const SyntaxHighlighter = makePrismAsyncLightSyntaxHighlighter({
  // 使用暗色主题
  style: () => import("react-syntax-highlighter/dist/esm/styles/prism/one-dark"),
  // 按需加载语言支持
  supportedLanguages: {
    // Web 前端
    javascript: () => import("refractor/lang/javascript"),
    typescript: () => import("refractor/lang/typescript"),
    jsx: () => import("refractor/lang/jsx"),
    tsx: () => import("refractor/lang/tsx"),
    css: () => import("refractor/lang/css"),
    scss: () => import("refractor/lang/scss"),
    html: () => import("refractor/lang/markup"),
    xml: () => import("refractor/lang/markup"),
    
    // 后端语言
    python: () => import("refractor/lang/python"),
    java: () => import("refractor/lang/java"),
    go: () => import("refractor/lang/go"),
    rust: () => import("refractor/lang/rust"),
    c: () => import("refractor/lang/c"),
    cpp: () => import("refractor/lang/cpp"),
    csharp: () => import("refractor/lang/csharp"),
    php: () => import("refractor/lang/php"),
    ruby: () => import("refractor/lang/ruby"),
    swift: () => import("refractor/lang/swift"),
    kotlin: () => import("refractor/lang/kotlin"),
    
    // 脚本和配置
    bash: () => import("refractor/lang/bash"),
    shell: () => import("refractor/lang/bash"),
    sh: () => import("refractor/lang/bash"),
    zsh: () => import("refractor/lang/bash"),
    powershell: () => import("refractor/lang/powershell"),
    
    // 数据格式
    json: () => import("refractor/lang/json"),
    yaml: () => import("refractor/lang/yaml"),
    yml: () => import("refractor/lang/yaml"),
    toml: () => import("refractor/lang/toml"),
    
    // 数据库
    sql: () => import("refractor/lang/sql"),
    graphql: () => import("refractor/lang/graphql"),
    
    // 标记语言
    markdown: () => import("refractor/lang/markdown"),
    md: () => import("refractor/lang/markdown"),
    latex: () => import("refractor/lang/latex"),
    
    // 其他
    docker: () => import("refractor/lang/docker"),
    dockerfile: () => import("refractor/lang/docker"),
    nginx: () => import("refractor/lang/nginx"),
    diff: () => import("refractor/lang/diff"),
    regex: () => import("refractor/lang/regex"),
  },
});
