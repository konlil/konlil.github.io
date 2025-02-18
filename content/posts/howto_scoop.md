+++ 
title: "在 Windows 系统上安装 Scoop 的完整指南"
date: "2025-02-18T04:19:51.431Z"
draft: false
description: "本指南详细介绍了在 Windows 系统上安装 Scoop 的步骤，包括常见问题解决方案和使用技巧。"
tags: ["Scoop", "Windows", "包管理器", "Hugo"]
slug = ""
authors = ["konlil"]
categories = []
externalLink = ""
series = []
+++


### **Scoop 是什么？**
Scoop 是 Windows 的包管理器，可通过命令行快速安装开发工具（如 Hugo、Git 等），无需手动下载安装包。

---

### **安装前准备**
1. 确认系统要求：
   - Windows 7+
   - PowerShell 5.1 或更高版本（Win10+ 自带）
   - 允许执行 PowerShell 脚本

2. **检查 PowerShell 版本**：
   ```powershell
   $PSVersionTable.PSVersion  # 输出应显示 Major ≥5
   ```

---

### **安装 Scoop（分两种模式）**
#### **模式一：普通用户安装（推荐）**
不需要管理员权限，软件默认安装到 `C:\Users\<用户名>\scoop`

```powershell
# 1. 打开 PowerShell（非管理员）
# 2. 设置允许执行脚本（一次性操作）
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. 安装 Scoop
irm get.scoop.sh | iex
```

#### **模式二：系统级安装（管理员权限）**
需要管理员权限，软件安装到 `C:\ProgramData\scoop`

```powershell
# 1. 以管理员身份运行 PowerShell
# 2. 执行安装命令
irm get.scoop.sh -outfile 'install.ps1'
.\install.ps1 -RunAsAdmin
```

---

### **验证安装**
```powershell
scoop help  # 显示帮助信息即成功
```

---

### **配置常用仓库**
```powershell
# 添加官方推荐仓库
scoop bucket add main      # 基础仓库（默认已添加）
scoop bucket add extras    # 扩展软件（如 VSCode、FFmpeg）
scoop bucket add versions  # 多版本软件（如不同 Python 版本）

# 查看已添加仓库
scoop bucket list
```

---

### **安装 Hugo**
```powershell
scoop install hugo  # 自动处理依赖（如 Git）
hugo version        # 验证安装
```

---

### **常见问题解决**
#### **1. 执行策略阻止安装**
```powershell
# 错误提示：无法加载文件，因为在此系统上禁止运行脚本
# 解决方法：
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### **2. 网络问题导致安装失败**
- 确保能访问 GitHub（可能需要代理）
- 手动下载安装脚本：
  ```powershell
  # 下载安装脚本
  Invoke-WebRequest -Uri https://raw.githubusercontent.com/ScoopInstaller/Install/master/install.ps1 -OutFile install.ps1
  # 手动执行
  .\install.ps1 -RunAsAdmin  # 管理员模式
  ```

#### **3. 路径污染（Path 冲突）**
如果出现命令冲突：
```powershell
scoop reset <软件名>  # 例如 scoop reset hugo
```

---

### **高效使用技巧**
1. **更新软件**：
   ```powershell
   scoop update         # 更新 Scoop 自身
   scoop status         # 查看可更新软件
   scoop update hugo    # 更新指定软件
   ```

2. **清理缓存**：
   ```powershell
   scoop cache rm *     # 清理所有下载缓存
   ```

3. **快速搜索**：
   ```powershell
   scoop search hugo    # 搜索 Hugo 相关软件
   ```

---

通过以上步骤，你可以在 Windows 上完成 Scoop 的安装，并通过 `scoop install hugo` 继续之前的 Hugo 建站流程。