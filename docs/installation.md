# 安装与更新

[English](installation.en.md) · [返回 README](../README.md)

安装已构建版本无需 Node.js、pnpm 或源码构建。

## 下载

- [下载最新版安装包](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases/latest/download/fe-tools-chrome-extension.zip)
- [查看全部版本](https://github.com/MichealWayne/fe-tools-chrome-plugin/releases)

在 Release 的 Assets 中选择 `fe-tools-chrome-extension.zip`。`Source code (zip)` 和
`Source code (tar.gz)` 是源码，不是可直接加载的安装包。最新版直链在首个包含同名安装包的
正式版发布后生效；Draft Release 尚未公开，普通用户无法下载。

可同时下载 `SHA256SUMS.txt` 校验 ZIP 完整性。在下载目录运行：

```sh
# macOS
shasum -a 256 -c SHA256SUMS.txt
# Linux
sha256sum -c SHA256SUMS.txt
```

Windows PowerShell 可运行 `Get-FileHash .\fe-tools-chrome-extension.zip -Algorithm SHA256`，
将结果与 `SHA256SUMS.txt` 中的值比较。

## 加载到 Chrome

1. 解压 ZIP 到长期保留的目录，例如 `Documents/fe-tools-chrome-extension`。
2. 确认目录结构如下；选择目录时以 `manifest.json` 所在层为准。

   ```text
   fe-tools-chrome-extension/
     manifest.json
     index.html
     icon.png
     assets/
     scripts/
     _locales/
   ```

3. 在 Chrome 地址栏输入 `chrome://extensions/`。
4. 打开页面右上角「开发者模式」。
5. 点击「加载已解压的扩展程序」，选择上述目录。
6. 点击浏览器工具栏的扩展程序按钮，将 FrontEnd Tools 固定到工具栏。

请保留开发者模式和安装目录。加载后的扩展仍依赖这些文件，不能删除或移动目录。
扩展的站点访问权限及联网功能见 [README 权限说明](../README.md#扩展权限与数据)。

## 手动更新

GitHub ZIP 安装方式不会自动更新。

1. 导出或备份重要的 Postman 请求、环境配置等数据，并备份旧安装目录。
2. 下载并解压新版本，关闭插件页面和进行中的操作。
3. 保持原安装目录路径不变，用新版内容完整替换其中的旧文件，避免混留旧版资源。
4. 在 `chrome://extensions/` 中点击该扩展的重新加载按钮，检查版本号。
5. 刷新需要截图或技术栈检测的网页，再打开插件。

优先在原目录更新并重新加载，避免卸载重装造成扩展数据丢失。请勿仅点击 Chrome 的「更新」
按钮并期待它从 GitHub 下载 ZIP。

## 回退与常见问题

- **需要旧版本**：在历史 Releases 下载旧包，备份当前目录和重要数据后按更新步骤替换。
  代码回退不保证存储格式向后兼容；重要数据应先导出。
- **提示缺少 Manifest**：确认已解压，并选择直接包含 `manifest.json` 的目录。
- **只看到 src、package.json**：下载的是源码；返回 Release 下载安装附件。
- **最新版链接返回 404**：先查看 Releases 是否已有包含同名安装附件的正式版。
- **页面工具在更新后无响应**：重新加载扩展，再刷新目标网页。
- **受管理的 Chrome 禁止开发者模式**：需要管理员允许，安装包不能绕过浏览器策略。
- **Chrome 内置页无法截图或检测**：请在普通 HTTP(S) 网页上使用这些功能。

安装方式参考 [Chrome 官方说明](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)。
