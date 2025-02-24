---
title: "跨平台文件写入实现方案及注意事项"
date: 2025-02-21T04:38:05Z
categories: [技术, Flutter, 文件操作]
tags: [跨平台, Android, iOS, PC]
---

以下是针对跨平台文件写入需求的实现方案及注意事项：

---

### 一、核心挑战分析
1. **平台限制**：
   - **Android**：普通应用无法直接写入其他应用的私有目录 (`/data/data/`)，需依赖公共目录或游戏暴露的接口。
   - **iOS**：沙盒机制严格禁止访问其他应用目录，除非使用共享的 `App Group`。
   - **PC**：无沙盒限制，可直接操作文件系统。

2. **权限要求**：
   - **Android**：需要 `WRITE_EXTERNAL_STORAGE` 权限（API < 29）或使用 `Scoped Storage`（API ≥ 30）。
   - **iOS**：需配置 `App Group` 或依赖用户手动选择路径。

---

### 二、实现方案
#### 方案一：写入公共目录（推荐）
**前提**：游戏App需预先约定从设备的公共目录（如 `Downloads`）读取文件。

```dart
// 使用 path_provider 获取公共目录路径
import 'package:path_provider/path_provider.dart';
import 'dart:io';

Future<void> writeFileToPublicDir(String content) async {
  // 获取平台公共目录
  final Directory dir = await getDownloadsDirectory(); 
  final File file = File('${dir.path}/game_config.txt');
  
  await file.writeAsString(content);
  print('文件已保存至: ${file.path}');
}

// 调用示例
writeFileToPublicDir('Hello from Flutter Tool!');
```

#### 方案二：通过 App Group 共享目录（仅iOS）
1. **配置步骤**：
   - 为两个App启用相同的 `App Group`（Xcode -> Signing & Capabilities）。
   - 使用 `group.com.yourcompany.shared` 格式的标识符。

2. **代码实现**：
```dart
Future<void> writeFileToAppGroup(String content) async {
  final Directory? dir = await getApplicationSupportDirectory();
  final groupDir = Directory('${dir.parent.path}/group.com.yourcompany.shared');

  if (!await groupDir.exists()) {
    await groupDir.create(recursive: true);
  }

  final File file = File('${groupDir.path}/game_config.txt');
  await file.writeAsString(content);
}
```

#### 方案三：用户手动选择路径（全平台）
```dart
// 使用 file_picker 让用户选择保存位置
import 'package:file_picker/file_picker.dart';

Future<void> saveFileManually() async {
  String? path = await FilePicker.platform.saveFileName(
    dialogTitle: '选择保存位置',
    fileName: 'game_config.txt',
  );

  if (path != null) {
    final File file = File(path);
    await file.writeAsString('Hello from Flutter Tool!');
  }
}
```

---

### 三、完整工具App代码框架
```dart
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('游戏配置工具')),
        body: Center(
          child: Column(
            children: [
              ElevatedButton(
                onPressed: () => _writeConfigFile(),
                child: Text('生成配置文件'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _writeConfigFile() async {
    // Android 权限检查
    if (Platform.isAndroid) {
      final status = await Permission.storage.request();
      if (!status.isGranted) return;
    }

    // 写入内容
    const configContent = '''
    player_name: FlutterUser
    level: 100
    coins: 9999
    ''';

    try {
      final dir = await getDownloadsDirectory();
      final file = File('${dir?.path}/game_save_data.txt');
      await file.writeAsString(configContent);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('文件保存成功: ${file.path}')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('错误: ${e.toString()}')),
      );
    }
  }
}
```

---

### 四、关键依赖
```yaml
dependencies:
  flutter:
    sdk: flutter
  path_provider: ^2.0.14     # 获取系统路径
  permission_handler: ^10.3.0 # Android权限请求
  file_picker: ^5.3.3        # 文件选择（方案三）
```

---

### 五、注意事项
1. **Android适配**：
   - 在 `AndroidManifest.xml` 中添加权限：
     ```xml
     <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                     android:maxSdkVersion="28"/> <!-- 仅限旧设备 -->
     ```
   - 对 Android 11+ 使用 `MANAGE_EXTERNAL_STORAGE` 权限（需上架豁免）

2. **iOS适配**：
   - 在 `Info.plist` 中添加文件共享声明：
     ```xml
     <key>LSSupportsOpeningDocumentsInPlace</key>
     <true/>
     <key>UIFileSharingEnabled</key>
     <true/>
     ```

3. **游戏App对接**：
   - 确保游戏从以下路径读取文件：
     - Android: `/storage/emulated/0/Download/game_save_data.txt`
     - iOS: `App Group` 共享目录 或 `Files` App可见目录
     - Windows: `C:\Users\<user>\Downloads\game_save_data.txt`

4. **安全建议**：
   - 对写入内容做签名验证
   - 使用加密存储敏感数据
   - 限制文件操作权限

---