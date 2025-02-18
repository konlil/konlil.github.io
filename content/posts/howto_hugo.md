---
title: "在 GitHub Pages 上使用 Hugo 创建个人站点的完整步骤"
date: "2025-02-18T04:19:51.431Z"
draft: false
description: "本指南详细介绍了如何在 GitHub Pages 上使用 Hugo 创建个人站点，包括前期准备、创建站点、添加主题、创建内容、本地预览、部署到 GitHub Pages 以及自动化部署等步骤。"
tags: ["Hugo", "GitHub Pages", "个人站点", "静态网站生成器"]
---

### 一、前期准备
1. **安装 Hugo**：
   ```bash
   # MacOS
   brew install hugo

   # Windows (使用 Scoop)
   scoop install hugo

   # 验证安装
   hugo version
   ```

2. **创建 GitHub 仓库**：
   - 仓库名格式：`<username>.github.io`（必须全小写）
   - 勾选初始化 README（可选）

### 二、创建 Hugo 站点
```bash
hugo new site mysite --force  # 强制在当前目录创建
cd mysite
git init
```

### 三、添加主题（以 Ananke 为例）
```bash
git submodule add https://github.com/luizdepra/hugo-coder.git themes/hugo-coder

# 修改 config.toml
echo 'theme = "hugo-coder"' >> config.toml
```

### 四、创建内容
```bash
hugo new posts/first-post.md
# 编辑 content/posts/first-post.md：
# ---
# title: "Welcome"
# date: 2025-02-17T07:35:46Z
# draft: false  # 修改为 false 以发布
# ---
```

### 五、本地预览
```bash
hugo server -D --bind 0.0.0.0 --baseURL http://localhost:1313/
# 访问 http://localhost:1313 查看
```

### 六、部署到 GitHub Pages
1. **配置发布路径**：
   ```toml
   # config.toml 中添加
   baseURL = "https://<username>.github.io/"
   publishDir = "docs"  # 替代默认的 public 目录
   ```

2. **生成静态文件**：
   ```bash
   hugo  # 生成到 docs 目录
   ```

3. **GitHub 仓库设置**：
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<username>/<username>.github.io.git
   git push -u origin main

   # 在 GitHub 仓库设置：
   Settings → Pages → Branch: main → /docs → Save
   ```

### 七、自动化部署（可选）
创建 `.github/workflows/hugo.yml`：
```yaml
name: Hugo Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: '0.125.4'  # 使用你的 Hugo 版本

      - name: Build
        run: hugo --minify

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public  # 或 ./docs 根据你的配置
```

### 八、高级技巧
1. **自定义域名**：
   - 在 `static/` 目录创建 `CNAME` 文件，写入你的域名
   - DNS 设置添加 CNAME 记录指向 `<username>.github.io`

2. **多环境配置**：
   ```toml
   # config.toml
   [deployment]
   order = [".png$", ".jpg$", ".gif$", ".svg$"]
   
   [imaging]
   quality = 85
   ```

3. **内容管理**：
   ```bash
   # 批量修改 front matter
   find content/ -name "*.md" -exec sed -i '' 's/draft: true/draft: false/g' {} +
   ```

### 常见问题解决
1. **404 页面**：
   - 确保 `baseURL` 正确
   - 运行 `hugo --gc` 清理旧缓存

2. **样式丢失**：
   ```bash
   git submodule update --init --recursive  # 更新主题子模块
   ```

3. **构建错误**：
   ```bash
   hugo mod clean  # 清理模块缓存
   ```

部署成功后，你的站点将在 `https://<username>.github.io` 生效。首次部署可能需要 2-5 分钟生效，后续更新一般 1 分钟内可见。